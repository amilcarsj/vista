from Management.models import Trajectory, TrajectoryFeature,Database, POI_ROI
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, shape, Polygon,MultiPolygon
import numpy as np
from .models import TrajectoryFeature, Trajectory
from trajectory_library import Trajectory as tr
from trajectory_library.TrajectoryDescriptorFeature import TrajectoryDescriptorFeature
import json


def save_trajectory(file, tid, lat, lon, time, delimiter,db, pois_rois):

    df = pd.read_csv(file, delimiter, parse_dates=[time], index_col=time)
    print(df)
    print(df.columns.values)
    df.rename(columns={lat: "lat", lon: "lon"}, inplace=True)
    t = tr.Trajectory(mood='df', trajectory=df)
    t.get_features()
    df = t.return_row_data()
    geometry = [Point(xy) for xy in zip(df['lon'], df['lat'])]
    # crs = {'init': 'epsg:4326'}
    # gdf = gpd.GeoDataFrame(df, crs=crs, geometry=geometry)
    # print(gdf)
    traj = Trajectory()
    points = []
    for point in geometry:
        points.append([point.x, point.y])
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

def save_point_features(df, traj):
    feats = []
    print(df.columns.values)
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
        except Exception:
            print("Column %s was not added" % col)
    TrajectoryFeature.objects.bulk_create(feats)
