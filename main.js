var controller = (function () {

  var N_BATCH = 5;
  var folderPath = "images/full/";
  var listPath = "images/list.txt";
  var distPath = "images/STSIM.csv";
  
  var listimage;
  var label = [];

  var pool;
  var pressAllowed = true;

  var Pool = function(N) {
    // a class to store accessed image, 
    // and efficiently get random index
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

      var random = getRandomfromRange(0, this.N_not_seen);

      //swap with the end
      var tmp = this.pool[random];
      this.pool[random] = this.pool[this.N_not_seen];
      this.N_not_seen = this.N_not_seen - 1;

      return tmp;
    }
    this.getNSeen = function(){
      return this.N - this.N_not_seen - 1;
    }
    this.getNTotal = function(){
      return this.N;
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

  function submit() {
    // $('<form> <input type="text" style="z-index:10000" name="name"> <br> </form>').dialog({modal:true});

    var name = prompt("Please enter your name");

    console.log(name);

    var Label = Parse.Object.extend("Label");
    var result = new Label();
    result.set("labels", localStorage.getItem("labels"));
    result.set("name", name);

    result.save(null, {
      success : function(result) {
        console.log("Success");
        alert("Stored data sucessfully!");
        location.reload();
      },
      error: function(result, error) {
        console.log("Failure");
        alert("Error submitting data, error code:" + error.message);
      }
    });
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
      var label = $(this).find("input:radio:checked").val();
      console.log(id + ":" + label);
      label[id] = label;

      var tmp = localStorage.getItem("labels");
      localStorage.setItem("labels", tmp.concat(id + "," + label + "\n"));
    })

    console.log("You have seen: " + pool.getNSeen());
    $("#labelTrue").text("You have labeled: " + pool.getNSeen() + "/" + pool.getNTotal());

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

  return {
    init: function() {

      localStorage.clear();
      localStorage.setItem("labels","");

      // Ajax request to read textfile
      $.get(listPath, function(data){
        listimage = data.split("\n");
        
        //var N_TOTAL = listimage.length;
        var N_TOTAL = 10;

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

              $("<label>").attr({
                class: "radio",
              }).text("Natural").append(     
                $("<input />", {
                  type:   "radio",
                  name:   "label" + tmp,
                  value:  "1",
                })),

              '<br>',

              $("<label>").attr({
                class: "radio",
              }).text("Manmade").append(
                $("<input />", {
                  type:   "radio",
                  name:   "label" + tmp,
                  value:  "2",
                })
              ),

              '<br>',

              $("<label>").attr({
                class: "radio",
              }).text("Mixed").append(
                $("<input />", {
                  type:   "radio",
                  name:   "label" + tmp,
                  value:  "3"
                })
              )
            )
          )
        };
      })
      
      $("#buttonNext").on("click", Next);
      $("#buttonSubmit").on("click", submit);

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

      Parse.initialize("q11aUUt7JFAjjr3vSHnCDUVi7xFDx0vYWTkGR4gA", "fR1i3W3vDMLkFCFqC57IFb0lP3Uc73whNPJhKz1w");
    
      // var TestObject = Parse.Object.extend("TestObject");
      // var testObject = new TestObject();
      // testObject.save({asdfasdf: "storing data file"}, {
      //   success: function(object) {
      //     alert("yay! it worked");
      //   }
      // });

    }
  }
}) ();