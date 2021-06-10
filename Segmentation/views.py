from django.shortcuts import render, redirect
from Management.models import Database, Trajectory, POI_ROI, TrajectoryFeature
from django.http import JsonResponse
from .models import TrajectorySegmentation, SegmentFeature, Segment

from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
import json
from datetime import datetime
from trajectory_library.TrajectoryDescriptorFeature import TrajectoryDescriptorFeature
import pandas as pd
from trajectory_library import Trajectory as tr
from trajectory_library.TrajectoryDescriptorFeature import TrajectoryDescriptorFeature

import requests

def pick_set(request):
    if request.method == 'GET':
        dblist = []
        dbs = Database.objects.all()
        for db in dbs:
            print(db.taggers)
            if request.user.id in db.taggers_id:
                dblist.append((str(db._id), db.name))
        return render(request, 'pick_database.html', {'databases': dblist})
    else:
        db = request.POST.get('database', "")
        return redirect('/segmentation/database/%s/' % db)


@login_required()
def load_segment_session(request, db_id="", tid=None):
    if db_id == "":
        return redirect('/segmentation/database/')
    layers = list(POI_ROI.objects.filter(db___id=db_id).values())
    n = None
    prev = None
    for layer in layers:
        layer['_id'] = str(layer['_id'])
        layer['db_id'] = str(layer['db_id'])
    # trajectory = utils.get_trajectory(request.user, db_id, None)
    trajectories = Trajectory.objects.filter(db___id=db_id)
    print("print the value of trajectories")
    print(40*"-")
    print(trajectories)
    values = trajectories.values().iterator()

    # print("print the value of values")
    # print(values)
    curr_index=1
    if tid is None:
        prev = None
        traj = next(values)

        try:
            n = next(values)['_id']
        except StopIteration:
            pass
    else:
        traj = next(values)
        while str(traj['_id']) != tid:
            curr_index+=1
            prev = traj['_id']
            traj = next(values)
        try:
            n = next(values)['_id']
        except StopIteration:
            pass

    traj['_id'] = str(traj['_id'])
    traj['db_id'] = str(traj['db_id'])
    point_features = TrajectoryFeature.objects.filter(trajectory___id=traj['_id']).values()
    curr_pf = point_features.first()
    pfs = []

    tseg = TrajectorySegmentation.objects.filter(user=request.user,
                                                         trajectory___id=traj['_id']).first()
    segs = []
    if tseg is not None:
        for s in tseg.segmentation:
            segs.append([s.label, s.end_index])

    for pf in point_features:
        pfs.append({'id': pf['_id'], 'name': pf['name']})

    curr_pf['_id'] = str(curr_pf['_id'])
    curr_pf['trajectory_id'] = str(curr_pf['trajectory_id'])
    layers_json = json.dumps(layers)
    traj['times'] = []
    traj_json = json.dumps(traj)
    curr_pf_json = json.dumps(curr_pf)
    labels = Database.objects.get(_id=db_id).labels
    labels_json = json.dumps(labels)
    prev = str(prev)
    n = str(n)
    print("Previous: " + prev)
    print("Current: " + traj['_id'])
    print("Next: " + n)
    print("Value of label json")
    print(labels_json)
    print(segs)
    if len(prev) != 4:
        point_features = TrajectoryFeature.objects.filter(trajectory___id=traj['_id']).values()
        curr_pf = point_features.first()
        feats = TrajectoryFeature.objects.filter(trajectory___id=traj['_id'])
        traj = Trajectory.objects.get(_id=traj['_id'])
        latlon = traj.geojson['geometry']['coordinates']
        lat, lon = zip(*latlon)
        df = pd.DataFrame(index=pd.to_datetime(traj.times))
        df['lat'] = lat
        df['lon'] = lon
        for f in feats:
            df[f.name] = f.values
        
        # print("Value of df from load segmentation function")
        # print(df)
        df = df.reset_index()
        df.rename({'index': 'time'}, axis=1, inplace=True)
        df.to_csv('test_data.csv') 
        # url_response = call_endpoint(request)
        # print("value of url response")
        # print(url_response)
    return render(request, 'segmentation_page.html', {'layers': layers_json, 'trajectory': traj_json,
                                                      'curr_pf': curr_pf_json, 'point_features': pfs,
                                                      'labels': labels_json, 'next': n, 'previous': prev, 'db': db_id,'segments':segs,
                                                      'curr_index':curr_index,'size':len(trajectories)})


def call_endpoint(request):
    url = 'http://0.0.0.0:80/output'
    # payload = {'Token':'My_Secret_Token','product':'product_select_in_form','price':'price_selected_in_form'}
    response = requests.get(url)
    return response

@login_required()
def get_trajectory(request, traj_id):
    Trajectory.objects.get(_id=traj_id)

    return


def submit_segmentation(request):
    markers = request.POST.get('marker_locations', [])
    id = request.POST.get('id', None)



    markers_list = json.loads(markers)
    markers_list.sort(key=lambda x: x['start_index'], reverse=False)

    #print(markers_list)
    if id is not None:
        traj = Trajectory.objects.get(_id=id)

    feats = TrajectoryFeature.objects.filter(trajectory___id=id)
    segment_list = []
    for segment in markers_list:
        s = Segment()
        s.start_index = segment['start_index']
        s.end_index = segment['end_index']
        s.label = segment['label']
        feat_list = []
        for f in feats:
            sf = SegmentFeature()
            values = f.values[segment['start_index']:segment['end_index'] + 1]
            tdf = TrajectoryDescriptorFeature()
            feat_stats = tdf.describe(values)
            sf.min = feat_stats[0]
            sf.max = feat_stats[1]
            sf.mean = feat_stats[2]
            sf.median = feat_stats[3]
            sf.std = feat_stats[4]
            sf.percentile_10 = feat_stats[5]
            sf.percentile_25 = feat_stats[6]
            sf.percentile_50 = feat_stats[7]
            sf.percentile_75 = feat_stats[8]
            sf.percentile_90 = feat_stats[9]
            sf.name = f.name
            feat_list.append(sf)
        s.features = feat_list
        segment_list.append(s)

    try:
        segment = TrajectorySegmentation.objects.get(trajectory___id=id, user_id=request.user.id)
    except:
        segment = TrajectorySegmentation()

    segment.trajectory = traj
    segment.segmentation = segment_list
    segment.user = request.user
    segment.start_time = datetime.strptime(request.POST.get('start_time', None), "%a, %d %b %Y %H:%M:%S %Z")
    segment.end_time = datetime.strptime(request.POST.get('end_time', None), "%a, %d %b %Y %H:%M:%S %Z")
    segment.save()
    return JsonResponse({})


def select_session_review(request):
    if request.method == 'GET':
        dbs = Database.objects.filter(tagging_session_manager=request.user)
        db_list = [(str(d._id), d.name) for d in dbs]
        return render(request, 'select_session_review.html', {'dbs': db_list})
    else:
        dbid = request.POST.get('database_select')
        return redirect('/segmentation/review/%s/' % dbid)


def review_session(request, session_id=""):
    db = Database.objects.get(_id=session_id)
    labels = db.labels
    user_data = {}
    features_qs = TrajectoryFeature.objects.filter(trajectory__db___id=session_id)
    features = list(set([f.name for f in features_qs]))
    users_qs = User.objects.filter(id__in=db.taggers_id)
    users = []
    for user in users_qs:
        traj_segmentation = TrajectorySegmentation.objects.filter(trajectory__db___id=session_id, user=user)
        if not traj_segmentation.exists():
            continue
        average_pf = {}
        average_sf = {}
        users.append(user.email)
        for l in labels:
            average_pf[l] = {}
            average_sf[l] = {}

        for feat in features:
            for l in labels:
                average_pf[l][feat] = 0
                average_pf[l]['count'] = 0
                average_sf[l][feat] = 0
                average_sf[l]['count'] = 0
        for s in traj_segmentation:
            for seg in s.segmentation:
                l = seg.label
                average_pf[l]['count'] += (seg.end_index - seg.start_index)
                average_sf[l]['count'] += 1
                for feat in seg.features:
                    average_pf[l][feat.name] += (feat.mean * (seg.end_index - seg.start_index))
                    average_sf[l][feat.name] += feat.mean
        for feat in features:
            for l in labels:
                print(l + " " + feat)
                try:
                    average_pf[l][feat] /= average_pf[l]['count']
                    print(average_pf[l][feat])
                    average_sf[l][feat] /= average_sf[l]['count']
                    average_pf[l][feat]
                    print(average_sf[l][feat])
                except ZeroDivisionError:
                    average_pf[l][feat] = 0
                    average_sf[l][feat] = 0
        user_data[user.email] = {}
        user_data[user.email]['point_features'] = average_pf
        user_data[user.email]['segment_features'] = average_sf

    return render(request, 'session_information.html',
                  {'user_data': user_data, 'labels': labels, 'features': features, 'users': users})



def submit_segmentation2(request):

    markers = request.POST.get('marker_locations', [])
    
    id = request.POST.get('id', None)
    trajectory_segmentation = TrajectorySegmentation()

    markers_list = json.loads(markers)
    
    markers_list.sort(key=lambda x: x['start_index'], reverse=False)
    print("Value of markers_list")
    print(markers_list)
    feats = TrajectoryFeature.objects.filter(trajectory___id=id)
    
    traj = Trajectory.objects.get(_id=id)
    
    latlon = traj.geojson['geometry']['coordinates']
    
    lat, lon = zip(*latlon)
    
    trajectory_segmentation.trajectory = traj
    
    df = pd.DataFrame(index=pd.to_datetime(traj.times))
    df['lat'] = lat
    df['lon'] = lon
    
    for f in feats:
        df[f.name] = f.values
    
    temp_df = pd.DataFrame()
    for m in markers_list:
        
        temp = df[m['start_index']:m['end_index']+1] 
        temp.insert(loc=1, column='label', value = m['label'])
        if m['label'] == 'bike':
            temp.insert(loc=1, column='sid', value = 0)
        elif m['label'] == 'car':
            temp.insert(loc=1, column='sid', value = 1)
        elif m['label'] == 'walk':
            temp.insert(loc=1, column='sid', value = 2)
        else :
            temp.insert(loc=1, column='sid', value = 3)
        temp_df = pd.concat([temp_df,temp])
       
    temp_df = temp_df.reset_index()
    temp_df.rename({'index': 'time'}, axis=1, inplace=True)
    temp_df.to_csv('train_data.csv') 
        
           
    segmentation = []
    for m in markers_list:
        seg = Segment()
        seg.start_index = m['start_index']
        seg.end_index = m['end_index']
        seg.label = m['label']
        recomputed_df = df[m['start_index']:m['end_index']+1]
        recomputed_df.insert(loc=1, column='label', value = m['label'])
        t = tr.Trajectory(mood='df', trajectory=recomputed_df)
        t.get_features()
        recomputed_df = t.return_row_data()
            
        

        feats = []
        recomputed_df.drop(['lat', 'lon'],axis=1, inplace=True)
        
        for col in recomputed_df.columns.values:
            feat = SegmentFeature()
            try:
                l = recomputed_df[col].tolist()
                tdf = TrajectoryDescriptorFeature()
                feat_stats = tdf.describe(l)
                feat.name = col
                feat.min = feat_stats[0]
                feat.max = feat_stats[1]
                feat.mean = feat_stats[2]
                feat.median = feat_stats[3]
                feat.std = feat_stats[4]
                feat.percentile_10 = feat_stats[5]
                feat.percentile_25 = feat_stats[6]
                feat.percentile_50 = feat_stats[7]
                feat.percentile_75 = feat_stats[8]
                feat.percentile_90 = feat_stats[9]
                feat.name = col
                feat.trajectory = traj
                feats.append(feat)
            except Exception as e:
                print(e)
                print("Column %s was not added" % col)
        seg.features = feats
       
        segmentation.append(seg)
        # print("value of segmentation")
        # print(segmentation)
    trajectory_segmentation.segmentation = segmentation
    trajectory_segmentation.user = request.user
    trajectory_segmentation.start_time = datetime.strptime(request.POST.get('start_time', None), "%a, %d %b %Y %H:%M:%S %Z")
    trajectory_segmentation.end_time = datetime.strptime(request.POST.get('end_time', None), "%a, %d %b %Y %H:%M:%S %Z")
    trajectory_segmentation.save()
    
    return JsonResponse({"status":"Good"})
