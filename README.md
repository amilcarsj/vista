# vista
A visual analytics platform for semantic annotation of trajectories


# To Setup

1. Create a new Anaconda Environment
2. conda install -c conda-forge django==2.2.2 geopandas==0.5.0 
3. 
pip install djongo==1.2.32
pip install pywavelets
pip install scipy
pip install geojson
pip install pandas==1.0.1 # Pandas should be already installed but the current version produces an error, this version fixes the problem
4. Make sure mongodb is running, the current project is set to look at the  default 27017 port.
5. python manage.py migrate
6. python manage.py runserver
7. Navigate to localhost:8000