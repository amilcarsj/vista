from Management.models import Trajectory, TrajectoryFeature,Database, POI_ROI
import pandas as pd
from shapely.geometry import Point, shape, Polygon,MultiPolygon,MultiPoint
from .models import TrajectoryFeature, Trajectory
from trajectory_library import Trajectory as tr
from trajectory_library.TrajectoryDescriptorFeature import TrajectoryDescriptorFeature
import json,geojson
from math import radians, cos, sin, asin, sqrt
from geopandas import GeoDataFrame,overlay,GeoSeries
import numpy as np
from datetime import datetime

def save_trajectory(file, tid, lat, lon, time, delimiter,db, pois_rois):

    df = pd.read_csv(file, delimiter, parse_dates=[time], index_col=time)
    #df = pd.read_csv(file, delimiter, parse_dates=[time])
    print(df.columns.values)
    df.rename(columns={lat: "lat", lon: "lon"}, inplace=True)
    print(df.columns.values)
    linestring = [Point(xy) for xy in zip(df['lon'], df['lat'])]

    #gdf = df.drop(['lon', 'lat'], axis=1)
    crs = {'init': 'epsg:4326'}
    points_geoseries = GeoSeries(linestring, crs=crs)

    t = tr.Trajectory(mood='df', trajectory=df)
    t.get_features()
    df = t.return_row_data()
    points = [[p.y,p.x] for p in linestring]
    traj = Trajectory()
    traj.total_points = len(points)
    traj.average_sampling = df['td'].mean()
    traj.total_distance_traveled = df['distance'].sum()
    traj.geojson = {'geometry': {'type': 'LineString', 'coordinates': points}}
    traj.db = db
    ns = 1e-9
    traj.times = [datetime.utcfromtimestamp(dt.astype(int) * ns) for dt in df.index.values]
    traj.save()
    for layer in pois_rois:
        name = layer.name
        if layer.type == POI_ROI.ROI:
            name += "_intersects"
            new_col = find_intersects(points_geoseries,layer)
        else:
            name += "_shortest_distance"
            new_col = find_shortest_distance(points_geoseries,layer)
        new_col = list(new_col)
        print(new_col)
        df[name] = new_col
        print(df[name])

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


def find_intersects(points_geoseries, roi):
    geo = geojson.loads(json.dumps(roi.geojson))
    polygons = []
    if type(geo) is geojson.FeatureCollection:
        for feature in geo.features:
            s = shape(feature.geometry)
            if type(s) == Polygon:
                polygons.append(s)
            elif type(s) == MultiPolygon:
                polygons += list(s)
            else:
                raise Exception("What is wrong")
        crs = {'init': 'epsg:4326'}
    mpolygon = MultiPolygon(polygons)
    multipolygons = [mpolygon]*len(points_geoseries)
    polygons_geoseries = GeoSeries(multipolygons,crs=crs)
    intersection = points_geoseries.within(polygons_geoseries)*1
    return intersection


def find_shortest_distance(points, poi):
    #raise Exception("Not implemented yet")
    min_dist_list = []
    geo = geojson.loads(json.dumps(poi.geojson))
    # polygons = GeoDataFrame.from_features(geo.features)
    points_interest = []
    if type(geo) is geojson.FeatureCollection:
        for feature in geo.features:
            s = shape(feature.geometry)
            if type(s) == Point:
                points_interest.append(s)
            elif type(s) == MultiPoint:
                points_interest += list(s)
            else:
                raise Exception("What is wrong")
        crs = {'init': 'epsg:4326'}
        points_interest_geoseries = GeoSeries(points_interest,crs=crs)
    return [min_dist(p,points_interest_geoseries) for p in points]
    """
    for point in points:
        min = 1000000000
        for p in poi:
            hav_dist = haversine_distance(point.y,point.x,p.y,p.x) # ???
            if hav_dist < min:
                min = hav_dist
        min_dist_list.append(min)
    return min_dist_list
    """

def min_dist(point_to_check,points):
    return points.distance(point_to_check).min()


#https://stackoverflow.com/questions/4913349/haversine-formula-in-python-bearing-and-distance-between-two-gps-points
def haversine_distance(lat1,lon1,lat2,lon2):
    lat1,lon1,lat2,lon2 = map(radians,[lat1,lon1,lat2,lon2])
    a = sin(lat2-lat1/2)**2 + cos(lat2) * sin(lon2-lon1/2)**2
    r = 6371
    return (2 * asin(sqrt(a))) * r


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
