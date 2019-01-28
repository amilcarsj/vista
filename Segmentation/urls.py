from django.urls import path
from Segmentation import views


urlpatterns = [
    path('database/', views.pick_set),
    path('database/<str:db_id>/', views.load_segment_session),
    path('database/<str:db_id>/<str:tid>/',views.load_segment_session),
    path('review/<str:session_id>/', views.review_session),
    path('submit/', views.submit_segmentation2),
    path('review/',views.select_session_review)
]
