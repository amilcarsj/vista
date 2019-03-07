from django.shortcuts import render
import django.contrib.auth as auth
from django.contrib.auth.decorators import login_required
import json,datetime,pymongo,bson
from VISTA.settings import PORT_NUMBER,DATABASE_NAME
from bson.json_util import loads,RELAXED_JSON_OPTIONS

# Create your views here.


def login(request):
    print(request.method)
    if request.method == "GET":
        print("GET/")
        return render(request,'authentication.html')
    else:
        print("POST/")
        u = request.POST.get('username',"")
        p = request.POST.get('password',"")
        user = auth.authenticate(request,username=u, password=p)
        if user is not None:
            print("User: " + str(user))

            auth.login(request, user)
            return render(request, 'main_page.html')
        else:
            return render(request,'authentication.html',{'message':"Invalid username or password"})


def register(request):
    if request.method == "GET":
        return render(request,'authentication.html')
    u = request.POST.get('username', "")
    e = request.POST.get('email', "")
    p = request.POST.get('password',"")
    c = request.POST.get("confirm-password","")
    if p != c:
        return render(request, 'authentication.html', {'message': 'Password fields do not match'})
    user = auth.models.User.objects.create_user(u,e,p)
    user = auth.authenticate(username=u, password=p)
    print(user)
    if user is not None:
        auth.login(request, user)
        client = pymongo.MongoClient(port=PORT_NUMBER)
        db = getattr(client, DATABASE_NAME)
        with open('db.json') as f:
            dbs = loads(f.read(), json_options=RELAXED_JSON_OPTIONS)
        with open('features.json') as f:
            features = loads(f.read(), json_options=RELAXED_JSON_OPTIONS)
        with open('layer.json') as f:
            layers = loads(f.read(), json_options=RELAXED_JSON_OPTIONS)
        with open('trajectories.json') as f:
            # layers = json.load(f)
            trajectories = loads(f.read(), json_options=RELAXED_JSON_OPTIONS)
        dbs['tagging_session_manager_id'] = user.id
        dbs['taggers_id'].append(user.id)
        result = db.Management_database.insert_one(dbs)
        db_id = result.inserted_id
        layers['db_id'] = db_id
        db.Management_poi_roi.insert_one(layers)

        print(len(features))
        for t in trajectories:
            feature_list = []
            for f in features:
                if t['_id'] == f['trajectory_id']:
                    feature_list.append(f)
            t.pop('_id')
            t['db_id'] = db_id
            traj = db.Management_trajectory.insert_one(t)
            for f in feature_list:
                f['trajectory_id'] = traj.inserted_id
                db.Management_trajectoryfeature.insert_one(f)
        print(db_id)
        return render(request,'main_page.html')
    return render(request, 'authentication.html')

@login_required()
def logout(request):
    auth.logout(request)
    return render(request, 'authentication.html')


@login_required()
def index(request):
    return render(request,'main_page.html')