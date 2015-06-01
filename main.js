var controller = (function () {

  var N_BATCH = 5;
  var folderPath = "images/full/";
  var listPath = "images/list.txt";
  var distPath = "images/STSIM.csv";
  
  var listimage;
  var N_TOTAL = 10;

  var label = [];

  var pool;
  var pressAllowed = true;

  var Pool = function(N) {
    this.N = N;
    this.N_not_seen = N - 1;
    this.pool = [];

    for (var i = 0; i < N; i++) {
      this.pool.push(i);
    }

    this.getRandom = function() {
      // get and delete a random element from the Pool
      if (this.N_not_seen < 0)
        return -1;

      var random = getRandomfromRange(0, N_TOTAL-1);

      //swap with the end
      var tmp = this.pool[random];
      this.pool[random] = this.pool[this.N_not_seen];
      this.N_not_seen = this.N_not_seen - 1;

      return tmp;
    }
    this.getNSeen = function(){
      return this.N - this.N_not_seen - 1;
    }
  }

  function initializeArray(value, len) {
    // initialize an array of len with value
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(value);
    }
    return arr;  
  }

  function getRandomfromRange(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }

  function Submit() {
  }

  function Next() {
    if ($('#main div:not(:has(:radio:checked))').length > 0) {
      $("<div> You must select all labels before going next </div>").dialog();
      return;
    }
    var divBatch = $("#main div");

    // Record labels
    divBatch.map(function() {
      var id = $(this).find("img").attr("id");
      var label = $(this).find("input").attr("value");
      console.log(id + ":" + label);
      label[id] = label;
    })

    console.log("You have seen: " + pool.getNSeen());
    $("#labelTrue").text(pool.getNSeen() + "/" + N_TOTAL);

    // Shuffle
    $.each(divBatch, function() {
      var tmp = pool.getRandom();
      console.log(tmp);
      if (tmp < 0) {
        $("#buttonNext").prop("disabled", true);
        $("#buttonSubmit").css('display', 'inline');
        return;
      }

      $(this).find("img").attr({"src": folderPath.concat(listimage[tmp]),
                      "id": tmp})
    })

    $('#main input[type=radio]').attr('checked', false);
    }
  }

  return {
    init: function() {

      // Ajax request to read textfile
      $.get(listPath, function(data){
        listimage = data.split("\n");
        // N_TOTAL = listimage.length;

        pool = new Pool(N_TOTAL);
        label = initializeArray(0, N_TOTAL);

        // Setup UI
        for (i = 0; i < N_BATCH; i++) {
          var tmp = pool.getRandom();
          if (tmp < 0)
            return;

          $("#main").append(
            $("<div>").attr({'id': i, 'class':"image"}).append(
              $("<img />", {
                src: folderPath.concat(listimage[tmp]),
                id:  tmp
              }),
              '<br>',
              $("<input />", {
                type:   "radio",
                name:   "label" + tmp,
                value:  "1",
              }),
              $("<label>").text("Natural"),
              '<br>',
              $("<input />", {
                type:   "radio",
                name:   "label" + tmp,
                value:  "2",
              }),
              $("<label>").text("Manmade"),
              '<br>',
              $("<input />", {
                type:   "radio",
                name:   "label" + tmp,
                value:  "3",
              }),
              $("<label>").text("Mixed")
            )
          )
        };
      })
      
      $("#buttonNext").on("click", Next);
      $(window).keypress(function(e) {
        e.preventDefault();
        if (pressAllowed) {
          pressAllowed = false;
          if (e.keyCode == 0 || e.keyCode == 32) {
            Next();  
          }          
        }
      });

      $(window).keyup(function(e) {
        e.preventDefault();
        pressAllowed = true;
      });   
    }
  }
}) ();