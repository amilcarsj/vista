function increment_slider(){

}
function decrement_slider(){

}
function create_custom_slider(id,min,max){
    let decrement = $("<button/>", {
        text: "<<",
        click: decrement_slider
    });
    let increment = $("<button/>", {
        text: ">>",
        click: increment_slider
    });
    let slider = $("<input/>",{
        type:'range',
        'min':min,
        'max':max,
        'class':'slider',
        'id':'custom-slider'
    });
    let container = $("#"+id);
    if (!container.hasClass('slidecontainer')){
        container.addClass('slidecontainer');
    }
    container.append(decrement);
    container.append(slider);
    container.append(increment);

}
