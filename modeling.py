import requests, json, pandas, time
from time import mktime
from datetime import datetime, timedelta, date
from pandas.io.json import json_normalize
from functools import lru_cache
import progressbar
from concurrent import futures

from const import headers, reasons


def get_rids(f, t, fd, ft, td, tt):
    w = datetime.strptime(fd, '%Y-%m-%d').weekday()
    d = 'WEEKDAY' if w < 5 else 'SATURDAY' if w == 5 else 'SUNDAY'
    data = dict(from_loc=f, to_loc=t, from_time=ft, to_time=tt, from_date=fd, to_date=td, days=d)
    a = requests.post('https://hsp-prod.rockshore.net/api/v1/serviceMetrics', headers=headers,
                      data=json.dumps(data)).json()
    return [dict(rids=s['serviceAttributesMetrics']['rids'], gbtt_ptd=s['serviceAttributesMetrics']['gbtt_ptd'],
                 gbtt_pta=s['serviceAttributesMetrics']['gbtt_pta']) for s in a['Services']]


def load_train_road(arg):
    r, rids_row, f, t, adj_only, range_only = arg
    station_report_for_rid = []
    res = requests.post('https://hsp-prod.rockshore.net/api/v1/serviceDetails',
                        headers=headers, data=json.dumps(dict(rid=r))).json()
    locations_data_l = res['serviceAttributesDetails']['locations']
    if adj_only:
        def is_adj(locations, from_loc, to_loc):
            for pos, location_data in enumerate(locations):
                if location_data['location'] == from_loc:
                    if locations[pos + 1]['location'] == to_loc:
                        return True
                    else:
                        return False
            return False

        if not is_adj(locations_data_l, f, t):
            return station_report_for_rid
    for e in locations_data_l:
        e['rid'] = r
        e['toc_code'] = res['serviceAttributesDetails']['toc_code']
        e['date_of_service'] = res['serviceAttributesDetails']['date_of_service']
        e['dep'] = rids_row['gbtt_ptd']
        e['ar'] = rids_row['gbtt_pta']
        e['gad'] = '{}-{}'.format(e['dep'], e['ar'])
        station_report_for_rid.append(e)
    if not range_only:
        return station_report_for_rid
    else:
        station_report_for_rid_f = []
        add = False
        for e in station_report_for_rid:
            if e['location'] == f:
                add = True
            if add:
                station_report_for_rid_f.append(e)
            if e['location'] == t:
                add = False
        return station_report_for_rid_f


def ts_to_dt(a):
    k = time.strptime(a, '%H%M')
    return datetime(1971, 1, 1, k.tm_hour, k.tm_min)


def station_report(rids, f, t, adj_only, range_only):
    if not rids:
        return pandas.DataFrame(), dict()
    count = 0
    req_obj = list()
    for rids_row in rids:
        for r in rids_row['rids']:
            req_obj.append((r, rids_row, f, t, adj_only, range_only))
            count += 1

    station_data = []
    with futures.ThreadPoolExecutor(max_workers=20) as executor:
        resp = executor.map(load_train_road, req_obj)
        for r in resp:
            station_data.extend(r)
    p = json_normalize(station_data)
    # add location mapping to number
    loc_map = {}
    at = 0
    for l in p.location.values:
        if l not in loc_map:
            at += 1
            loc_map[l] = at

    def m(j):
        return loc_map[j]

    p['loc_index'] = p['location'].map(m)

    def delta(a, b):
        if not a or not b:
            return 0
        ac = ts_to_dt(a)
        bc = ts_to_dt(b)
        if ac == bc:
            return 0
        return (ac - bc).total_seconds() if ac > bc else -(bc - ac).total_seconds()

    p['a_delta'] = p.apply(lambda row: int(delta(row['actual_ta'], row['gbtt_pta']) // 60), axis=1)
    return p, loc_map


def delay_reason(p):
    c = p.late_canc_reason.value_counts()

    def m(j):
        return reasons[int(j)] if j and int(j) in reasons else ''

    c = c.reset_index(name='count')
    c['reason'] = c['index'].map(m)
    return c
