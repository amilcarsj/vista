from django.urls import path
from Management import views


urlpatterns = [
    path('create/database/', views.create_database),
    path('edit/database/<str:_id>/',views.update_database),
    path('select/database/', views.select_database),
    path('visualize/', views.visualize),
    path('get/trajectories/<str:db_id>/',views.get_trajectories),
    path('get/trajectory/<str:oid>/', views.get_trajectory),
    path('get/point_feature/<str:oid>/',views.get_point_feature),
    path('get/xy/<str:x>/<str:y>/',views.get_xy),
    path('delete/trajectory/<str:tid>/',views.delete_traj),
    path('delete/layer/<str:lid>/',views.delete_layer),
    path('info/',views.info)
]
