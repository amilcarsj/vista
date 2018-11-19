$(function(){
   $("#epf-add-feature").click(function(e){
        add_to_table("epf");
   });
   $("#gpf-add-feature").click(function(e){
        add_to_table("gpf");
   });
});
function add_to_table(epf_gpf){
    var name = $("#"+epf_gpf+"-new-name").val();
    var value = $("#"+epf_gpf+"-list").val();
    var type = epf_gpf==="epf"?"Extracted":"Generated";
    var row = "<tr><td>"+name+"</td><td>"+value+"</td><td>"+type+"</td><td><button class='btn btn-danger btn-row-remove'>Remove</button></td></tr>";
    $("#features-selected").append(row);
}