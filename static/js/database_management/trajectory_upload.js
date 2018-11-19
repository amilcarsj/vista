$(function () {
    $(document).on('change', '#trajectory-file', function () {
        var files = $('#trajectory-file').prop("files");
        var names = $.map(files, function (val) {
            return val.name;
        });
        var html_contruct = "";
        var i = 0;
        $("#trajectory-file-list").html("");
        for (i; i < names.length; i++) {
            html_contruct += "<option value='" + names[i] + "'>" + names[i] + "</option>";
        }
        $("#trajectory-file-list").append(html_contruct);
        console.log(names);
        read_data(files[0]);
    });
    $("#delimiter").change(function(e){
        console.log("Delimiter changed");
        var files = $('#trajectory-file').prop("files");

        if (files != null && files != 'undefined'){
            read_data(files[0]);
        }
    });
});

function read_data(file) {
    var reader = new FileReader();
    var extension = file.name.substr(file.name.lastIndexOf(".") + 1).toLowerCase();
    reader.onload = function (e) {
        console.log(extension);
        var file_content = reader.result;
        if (extension.toLowerCase() == 'csv') {
            var headers = get_csv_headers(file_content, $("#delimiter").val());
            fill_dropdowns(headers);
        }
        else {
            alert("That file extension is not supported currently");
        }
    }
    reader.readAsText(file);
}
function get_csv_headers(data, delimiter) {
    var allRows = data.split(/\r?\n|\r/);
    if (!allRows[0].includes(delimiter)) {
        return [];
    }
    var headers = allRows[0].split(delimiter);
    console.log(headers);
    return headers;
}

function fill_dropdowns(headers) {
    $(".trajddl").find('option').remove();
    console.log(headers);
    $('<option/>', {
        'value': null,
        'text': "None",
        'selected': true
    }).appendTo("#trajID");
    for (var i = 0; i < headers.length; i++) {
        $('<option/>', {
            'value': headers[i],
            'text': headers[i]
        }).appendTo(".trajddl");
    }
    find_proper_col(headers);
}

function find_proper_col(headers) {
    for (var i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase().indexOf('lat') != -1) {
            $("#trajLat").val(headers[i]);
        }
        else if (headers[i].toLowerCase().indexOf('lon') != -1) {
            $("#trajLon").val(headers[i]);
        }
        else if (headers[i].toLowerCase().indexOf('time') != -1) {
            $("#trajTime").val(headers[i]);
        }
    }
}