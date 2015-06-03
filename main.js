var controller = (function () {

  var N_BATCH = 10;
  var folderPath = "images/full/";
  var listPath = "images/list.txt";
  var distPath = "images/graph_0.80.txt";

  var Niter = 0;
  
  var listimage;
  var label;

  var pool;
  var pressAllowed = true;
  var N_TOTAL;

  // ====================== Pool data structure ======================
  var Pool = function(N) {
    // a class to store accessed image, 
    // and efficiently get random index and delete
    this.N = 0;  // length of array
    this.a = []; // array store value
    this.H = {}; // store mapping from value -> index

    for (var i = 0; i < N; i++) {
      this.insert(i);
    }
  }

  Pool.prototype.insert = function(value) {
    this.a.push(value);
    this.H[value] = this.N;
    this.N = this.N + 1;
  }

  Pool.prototype.getRandom = function() {
    // get a random element from the Pool
    if (this.N == 0)
      return -1;

    var random = getRandomfromRange(0, this.N -1);
    return this.a[random];
  }

  Pool.prototype.getRandomAndRemove = function() {
    var value = this.getRandom();
    if (value < 0)
      return -1;
    this.remove(value);
    return value;
  }

  Pool.prototype.contains = function(value){
    return (value in this.H)
  }

  Pool.prototype.remove = function(value){
    // move last element to replace current element
    if (!this.contains(value)) {
      //throw new Error("Value doesn't exist in the database");
      return;
    }

    var index = this.H[value]
    this.H[this.a[this.N - 1]] = index
    delete this.H[value]

    //swap
    var tmp = this.a[index]
    this.a[index] = this.a[this.N - 1]
    this.N = this.N - 1
  }

  Pool.prototype.getNremain = function(){
    return this.N;
  }
  // ========================= Label data structure ========================
  var Label = function(N, neighbors) {
    this.a = initializeArray(-1, N); // store the label
    this.Ndepth = 3
    this.adjacent = neighbors // undirected graph from nearest neighbors
    this.Nlabeled = 0
  }

  Label.prototype.put = function(key, label) {
    if (this.a[key] > 0)
      return;

    // Breadth First Search
    var queue = [];
    var depthQ = []; // queue to store depth, avoid using tuple in JS
    
    queue.push(key)
    depthQ.push(1)

    while(queue.length > 0) {
      var node = queue.shift()
      var depth = depthQ.shift()

      if (depth < this.Ndepth && this.a[node] < 0) {
        this.a[node] = label;
        this.Nlabeled = this.Nlabeled + 1;
        pool.remove(node);

        for (var j = 0; j < this.adjacent[node].length; j++) {
          var n = this.adjacent[node][j];
          if (this.a[n] < 0) {
            queue.push(n);
            depthQ.push(depth + 1);
          }
        }
      }
    }
  }

  Label.prototype.getLabel = function() {
    return this.a;
  }

  Label.prototype.getN = function() {
    return this.Nlabeled;
  }
  // ==================================================================

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
    var name = prompt("Please enter your name");

    var Result = Parse.Object.extend("Result");
    var result = new Result();
    result.set("selection", localStorage.getItem("labels"));
    result.set("iterativeLabels", localStorage.getItem("fullLabels"));
    result.set("final", label.getLabel());
    result.set("user", name);
    result.set("effort", Niter);

    result.save(null, {
      success : function(result) {
        console.log("Success");
        alert("Stored data sucessfully! Thank you for your participation!");
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
      var l = $(this).find("input:radio:checked").val();
      console.log(id + ":" + l);
      label.put(id, l);

      var tmp = localStorage.getItem("labels");
      localStorage.setItem("labels", tmp.concat(id + "," + l + "\n"));

    })

    var tmp = localStorage.getItem("fullLabels");
    console.log(tmp.concat(Niter + ":" + label.getLabel() + " "));
    localStorage.setItem("fullLabels", tmp.concat(Niter + ":" + label.getLabel() + "\n"))

    Niter = Niter + 1;

    $("#labelTrue").text("You have labeled: " + Niter * N_BATCH);
    $("#labelPropagation").text("After STSIM propagation: " + label.getN())

    if (label.getN() == N_TOTAL || pool.getNremain() <= 0) {
      $("#buttonNext").prop("disabled", true);
      $("#buttonSubmit").css('display', 'inline');
      return;
    }

    // Shuffle
    $.each(divBatch, function() {
      var tmp = pool.getRandomAndRemove();
      console.log(tmp);
      if (tmp < 0) {
        $(this).remove();
      }
      else {
        $(this).find("img").attr({"src": folderPath.concat(listimage[tmp]),
                        "id": tmp})
      }
    })

    $('#main input[type=radio]').attr('checked', false);
    
  }

  return {
    init: function() {

      localStorage.clear();
      localStorage.setItem("labels","");
      localStorage.setItem("fullLabels","");

      $.when($.get(listPath), $.get(distPath)).done(function(listdata, graphdata) 
      {
        listimage = listdata[0].trim().split("\n");
        
        N_TOTAL = listimage.length;
        pool = new Pool(N_TOTAL);

        // while(pool.getNremain() > 0) {
        //   console.log("Out: " + pool.getRandomAndRemove());
        //   console.log("Nremain: " + pool.getNremain())
        // }

        // Setup UI
        for (var i = 0; i < N_BATCH; i++) {
          var tmp = pool.getRandomAndRemove();
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

        // ==========================================

        var data = graphdata[0].trim().split("\n");

        var neighbors = []
        N_data = data.length;

        if (N_data != N_TOTAL) {
          throw new Error("List file and graph text must have same number " + N_TOTAL + "!=" + N_data)
        }

        for (var i = 0; i < N_data; i++) {
          neighbors.push(data[i].trim().split(" "));
        }
        label = new Label(N_data, neighbors);

        $("#labelTotal").text("Total images: " + N_TOTAL);
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

    }
  }
}) ();