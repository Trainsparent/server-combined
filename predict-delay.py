from datetime import datetime, timedelta

import pandas
from flask import Flask, jsonify, request

from modeling import get_rids, station_report

app = Flask(__name__)


def find_train(from_loc, to_loc, from_datetime, to_datetime=None):
    if to_datetime is None:
        to_datetime = from_datetime
    find_delayed = get_rids(from_loc, to_loc, from_datetime.strftime('%Y-%m-%d'),
                            from_datetime.strftime('%H%M'),
                            to_datetime.strftime('%Y-%m-%d'),
                            (to_datetime + timedelta(minutes=1)).strftime('%H%M'))
    return find_delayed[0:1]


@app.route('/hist')
def hist():
    from_datetime = datetime.strptime(request.args['on_date'], '%Y-%m-%d %H:%M')
    to_datetime = datetime.strptime(request.args['to_date'], '%Y-%m-%d %H:%M')
    from_loc = request.args['from_loc']
    to_loc = request.args['to_loc']
    our_train = find_train(from_loc, to_loc, from_datetime, to_datetime)
    maybe_delayed, maybe_delayed_loc_map = station_report(our_train, from_loc, to_loc, False, True)
    return jsonify(list(dict(actual_delta=str(i.a_delta), loc=str(i.location), date=str(i.date_of_service),
                             reason=str(i.late_canc_reason), actual_ta=str(i.actual_ta)) for i in
                        maybe_delayed.itertuples()))


@app.route('/predict')
def hello_world():
    from_datetime = datetime.strptime(request.args['on_date'], '%Y-%m-%d %H:%M')
    from_loc = request.args['from_loc']
    to_loc = request.args['to_loc']

    our_train = find_train(from_loc, to_loc, from_datetime)
    if not our_train:
        return jsonify([])
    maybe_delayed, maybe_delayed_loc_map = station_report(our_train, from_loc, to_loc, False, True)

    prev = None
    stations = []
    for r in maybe_delayed.itertuples():
        if prev is not None:
            stations.append((prev.location, r.location, prev.date_of_service, r.gbtt_pta))
        prev = r

    res = pandas.DataFrame()
    for station in stations:
        f, t, d, ta = station
        to_datetime = datetime.strptime('{} {}'.format(d, ta), '%Y-%m-%d %H%M')
        from_dt = to_datetime - timedelta(hours=2)
        rids = get_rids(f, t,
                        datetime.strftime(from_dt, '%Y-%m-%d'), datetime.strftime(from_dt, '%H%M'),
                        datetime.strftime(to_datetime, '%Y-%m-%d'),
                        datetime.strftime(to_datetime - timedelta(minutes=1), '%H%M'))
        elems, _ = station_report(rids, f, t, True, True)

        def f(g):
            a = list(g.itertuples())
            return a[1].a_delta - a[0].a_delta

        pl = elems.groupby('rid').apply(f).reset_index()
        pl.columns = ['rid', 'st']
        pl['location'] = t
        res = res.append(pl)

    ts = \
        maybe_delayed.join(res.groupby('location').mean(), on='location').join(res.groupby('location').std(),
                                                                               on='location', rsuffix='_std')
    ts = ts[['location', 'gbtt_pta', 'a_delta', 'st', 'st_std']]
    ts = ts.set_index('location')
    ts['pl'] = ts['st'].cumsum()
    ts['x'] = list(range(len(ts.index)))
    ts.set_value(from_loc, 'pl', 0)
    ts.set_value(from_loc, 'st', 0)
    ts.set_value(from_loc, 'st_std', 0)
    ts.set_value(from_loc, 'gbtt_pta', datetime.strftime(from_datetime, '%H%M'))
    result = []
    for row in ts.itertuples():
        result.append(dict(station_code=row.Index, arrival_time=str(row.gbtt_pta), actual_delay=str(row.a_delta),
                           est_delay_station=str(row.st), est_delay_total=str(row.pl), station_num=str(row.x),
                           std=row.st_std))
    return jsonify(result)


if __name__ == '__main__':
    app.run()
