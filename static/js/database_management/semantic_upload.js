$(function () {
    $(document).on('change', '#semantic-file', function () {
        var table = $("#semantic-tables");
        table.html("<tr><th>File Name</th><th>Layer Name</th></tr>");
        var files = $('#semantic-file').prop("files");
        var names = $.map(files, function (val) {
            return val.name;
        });
        var html_contruct = "";
        var html_list = "";
        var i = 0;
        var semfilelist = $("#semantic-file-list");
        semfilelist.html("");
        for (i; i < names.length; i++) {
            html_list += "<option value='"+names[i]+"'>"+names[i]+"</option>";
            html_contruct += "<tr><td>" + names[i] + "</td><td><input class='form-control' type='text' name='name_" + names[i] + "'></td></tr>";
        }
        table.append(html_contruct);
        semfilelist.append(html_list);
    });
});

function build_csv_table() {

}