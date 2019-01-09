
from django.contrib import admin
from django.urls import path,include
from . import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('Login.urls')),
    path('management/', include('Management.urls')),
    path('segmentation/', include('Segmentation.urls'))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)