from Management.models import Trajectory, TrajectoryFeature,Database, POI_ROI
import pandas as pd
from shapely.geometry import Point, shape, Polygon,MultiPolygon,MultiPoint,LineString,MultiLineString,mapping
from .models import TrajectoryFeature, Trajectory
from trajectory_library import Trajectory as tr
from trajectory_library.TrajectoryDescriptorFeature import TrajectoryDescriptorFeature
from trajectory_library.TrajectorySegmentation import TrajectorySegmentation
import json,geojson,fiona
from math import radians, cos, sin, asin, sqrt
from geopandas import GeoDataFrame,overlay,GeoSeries
import numpy as np
import copy
from datetime import datetime
from sys import getsizeof


def save_trajectory(file, tid, lat, lon, time, delimiter,db, pois_rois):

    df = pd.read_csv(file, delimiter, parse_dates=[time], index_col=time)
    #df = pd.read_csv(file, delimiter, parse_dates=[time])
    df.rename(columns={lat: "lat", lon: "lon"}, inplace=True)
    print("Trajectory Size: %d" % len(df))
    if tid != 'None':
        ts = TrajectorySegmentation()
        ts.load_dataframe(df)
        segment_indices, segments = ts.segmentByLabel(label=tid)
    else:
        segments = {0:df}
    for index, df in segments.items():
        #gdf = df.drop(['lon', 'lat'], axis=1)
        #crs = {'init': 'epsg:4326'}
        linestring = [Point(xy) for xy in zip(df['lon'], df['lat'])]
        points_geoseries = GeoSeries(linestring)
        points_geoseries.crs = fiona.crs.from_epsg(4326)
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
                new_col = find_intersects(points_geoseries, layer)
            else:
                #points_geoseries = simplify_linestring(points_geoseries)
                name += "_shortest_distance"
                new_col = find_shortest_distance(points_geoseries, layer,0.001)
            new_col = list(new_col)
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
    #data = json.loads(file_contents)
    data = simplify_linestring(file_contents)
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
                raise Exception("Layer contains more than polygons and MultiPolygons")
    #mpolygon = MultiPolygon(polygons)
    #multipolygons = [mpolygon]*len(points_geoseries)
    polygons_geoseries = GeoSeries(polygons)
    polygons_geoseries.crs = fiona.crs.from_epsg(4326)
    intersection = points_geoseries.within(polygons_geoseries.unary_union)*1
    return intersection


def find_shortest_distance(points, poi,starting_radius):
    #raise Exception("Not implemented yet")
    min_dist_list = []
    geo = geojson.loads(json.dumps(poi.geojson))
    # polygons = GeoDataFrame.from_features(geo.features)
    points_interest = []
    if type(geo) is geojson.FeatureCollection:
        for feature in geo.features:
            s = shape(feature.geometry)
            if type(s) == Point or type(s) == LineString:
                points_interest.append(s)
            elif type(s) == MultiPoint or type(s) == MultiLineString:
                points_interest += list(s)

            else:
                raise Exception("Layer contains more than points, MultiPoints, LineString, and MultiLineString")
        points_interest_geoseries = GeoSeries(points_interest)
        points_interest_geoseries.crs = fiona.crs.from_epsg(4326)

    min_dists = []
    radius = starting_radius
    #new_calc,old_calc = [], []
    for p in points:
        #d = datetime.now()
        dist,radius = min_dist(p,points_interest_geoseries,radius)
        #new_calc.append(datetime.now()-d)
        #d=datetime.now()
        #min_dist2(p,points_interest_geoseries)
        #old_calc.append(datetime.now()-d)
        min_dists.append(dist)
    #print(np.mean(new_calc))
    #print(np.mean(old_calc))
    return min_dists


def min_dist(point_to_check,points,radius):
    #print(point_to_check)
    within_radius, radius = get_points_by_radius(point_to_check,points,radius)
    return within_radius.distance(point_to_check).min(),radius


def min_dist2(point_to_check,points):
    return points.distance(point_to_check).min()


def min_dist3(point_to_check,points):
    return


def get_points_by_radius(point_to_check,points,n):
    intersection_points = GeoSeries()
    #print("Radius: %.3f" % n)
    while len(intersection_points)==0:
        circle = point_to_check.buffer(n)
        intersection_points = points.where(points.within(circle))
        intersection_points = intersection_points[intersection_points.notnull()]
        #print("%.3f %d" % (n,len(intersection_points)))
        if len(intersection_points)==0:
            n*=1.25
        elif len(intersection_points)>50:
            n/=1.1
    return intersection_points,n

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
            pass
            #print(e)
            #print("Column %s was not added" % col)
    TrajectoryFeature.objects.bulk_create(feats)


def simplify_linestring(gson):
    loaded_geo = geojson.loads(gson)
    new_feature_collection = copy.deepcopy(loaded_geo)
    new_feature_collection.features = []
    pointsa = 0
    pointsb = 0
    #print(getsizeof(loaded_geo))
    for geometry in loaded_geo.features:
        if type(geometry.geometry) is geojson.LineString or type(geometry.geometry) is geojson.MultiLineString:
            line = shape(geometry.geometry)
            feature = copy.deepcopy(geometry)
            pointsa+=len(line.coords)
            line = line.simplify(0.05,preserve_topology=False)
            pointsb+=len(line.coords)

            feature.geometry = mapping(line)
            new_feature_collection.features.append(feature)
    print(pointsa)
    print(pointsb)
    return new_feature_collection
"""
#https://stackoverflow.com/questions/4913349/haversine-formula-in-python-bearing-and-distance-between-two-gps-points
def haversine_distance(lat1,lon1,lat2,lon2):
    lat1,lon1,lat2,lon2 = map(radians,[lat1,lon1,lat2,lon2])
    a = sin(lat2-lat1/2)**2 + cos(lat2) * sin(lon2-lon1/2)**2
    r = 6371
    return (2 * asin(sqrt(a))) * r
"""