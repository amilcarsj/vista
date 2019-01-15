from Management.models import Trajectory, TrajectoryFeature,Database, POI_ROI
import pandas as pd
from shapely.geometry import Point, shape, Polygon,MultiPolygon
from .models import TrajectoryFeature, Trajectory
from trajectory_library import Trajectory as tr
from trajectory_library.TrajectoryDescriptorFeature import TrajectoryDescriptorFeature
import json
from math import radians, cos, sin, asin, sqrt

def save_trajectory(file, tid, lat, lon, time, delimiter,db, pois_rois):

    df = pd.read_csv(file, delimiter, parse_dates=[time], index_col=time)
    #df = pd.read_csv(file, delimiter, parse_dates=[time])
    print(df.columns.values)
    df.rename(columns={lat: "lat", lon: "lon"}, inplace=True)
    print(df.columns.values)

    t = tr.Trajectory(mood='df', trajectory=df)
    t.get_features()
    df = t.return_row_data()
    print(df.columns.values)
    print(df)
    geometry = [Point(xy) for xy in zip(df['lon'], df['lat'])]
    print(geometry)
    # crs = {'init': 'epsg:4326'}
    # gdf = gpd.GeoDataFrame(df, crs=crs, geometry=geometry)
    # print(gdf)
    traj = Trajectory()
    points = []
    for point in geometry:
        points.append([point.y, point.x])
    traj.total_points = len(geometry)
    traj.average_sampling = df['td'].mean()
    traj.total_distance_traveled = df['distance'].sum()
    traj.geojson = {'geometry': {'type': 'LineString', 'coordinates': points}}
    traj.db = db
    traj.save()
    for layer in pois_rois:
        name = layer.name
        if layer.type == POI_ROI.ROI:
            name += "_intersects"
            new_col = find_intersects(geometry,layer)

        else:
            name += "_shortest_distance"
            new_col = find_shortest_distance(points,layer)
        df[name] = new_col
    df = df.drop(['lon','lat'],axis=1)
    save_point_features(df,traj)


def save_poi_roi(file, name,db):
    layer = POI_ROI()
    file_contents = file.read()
    fc_lower = str(file_contents).lower()
    if "polygon" in fc_lower:
        layer.type = POI_ROI.ROI
    else:
        layer.type = POI_ROI.POI
    data = json.loads(file_contents)
    layer.geojson = data
    layer.db = db
    layer.name = name
    layer.save()
    print(data)
    return layer


def find_intersects(points, roi):
    intersects_list = []
    #polygons = MultiPolygon(roi.geojson['features'])
    #polygons.intersects(points)

    for p in points:
        intersects = 0
        for feature in roi.geojson['features']:
            polygon = shape(feature['geometry'])
            if polygon.contains(p):
                intersects = 1
                break
        intersects_list.append(intersects)

    return intersects_list


def find_shortest_distance(points, poi):
    raise Exception("Not implemented yet")
    min_dist_list = []
    for point in points:
        min = 10000000
        for p in poi:
            hav_dist = haversine_distance(point.y,point.x,p.y,p.x) # ???
            if hav_dist < min:
                min = hav_dist
        min_dist_list.append(min)
    return min_dist_list


def save_point_features(df, traj):
    feats = []
    for col in df.columns.values:
        feat = TrajectoryFeature()
        try:
            l = df[col].tolist()
            feat.values = l
            tdf = TrajectoryDescriptorFeature()
            feat_stats = tdf.describe(l)
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
            feat.name=col
            feat.trajectory = traj
            feats.append(feat)
        except Exception as e:
            print(e)
            print("Column %s was not added" % col)
    TrajectoryFeature.objects.bulk_create(feats)

#https://stackoverflow.com/questions/4913349/haversine-formula-in-python-bearing-and-distance-between-two-gps-points
def haversine_distance(lat1,lon1,lat2,lon2):
    lat1,lon1,lat2,lon2 = map(radians,[lat1,lon1,lat2,lon2])
    a = sin(lat2-lat1/2)**2 + cos(lat2) * sin(lon2-lon1/2)**2
    r = 6371
    return (2 * asin(sqrt(a))) * r
