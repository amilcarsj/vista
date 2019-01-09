from django.shortcuts import render
import django.contrib.auth as auth
from django.contrib.auth.decorators import login_required
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
        return render(request,'main_page.html')
    return render(request, 'authentication.html')

@login_required()
def logout(request):
    auth.logout(request)
    return render(request, 'authentication.html')


@login_required()
def index(request):
    return render(request,'main_page.html')