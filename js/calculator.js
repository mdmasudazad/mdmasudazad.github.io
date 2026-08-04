/* ==========================================================
   Hybrid FEM-ML Stiffness Predictor
   Version 1
========================================================== */

const predictButton = document.getElementById("predictBtn");
const predictionValue = document.getElementById("predictionValue");

const detailsButton = document.getElementById("toggleDetails");
const detailsSection = document.getElementById("detailsSection");

/*=========================================
        DETAILS TOGGLE
=========================================*/

detailsButton.addEventListener("click", () => {

    detailsSection.classList.toggle("active");

    if(detailsSection.classList.contains("active")){

        detailsButton.innerHTML = "Hide Details ▲";

    }

    else{

        detailsButton.innerHTML = "Show Details ▼";

    }

});


/*=========================================
        GET INPUTS
=========================================*/

function getInputs(){

    return{

        length:
        Number(document.getElementById("length").value),

        height:
        Number(document.getElementById("height").value),

        Thickness:
        Number(document.getElementById("Thickness").value),

        totaltyrestacks:
        Number(document.getElementById("steelThickness").value),

        shapeFactor:
        Number(document.getElementById("shapeFactor").value),

        aspectRatio:
        Number(document.getElementById("aspectRatio").value)

    };

}


/*=========================================
        VALIDATION
=========================================*/

function validateInputs(data){

    for(const key in data){

        if(isNaN(data[key])){

            alert("Please fill all input parameters.");

            return false;

        }

    }

    return true;

}


/*=========================================
        NUMBER ANIMATION
=========================================*/

function animatePrediction(target){

    let start = 0;

    const duration = 1000;

    const increment = target / 60;

    const timer = setInterval(()=>{

        start += increment;

        if(start >= target){

            clearInterval(timer);

            predictionValue.innerHTML =
            target.toFixed(2)+" N/mm";

        }

        else{

            predictionValue.innerHTML =
            start.toFixed(2)+" N/mm";

        }

    },duration/60);

}


/*=========================================
        DUMMY MODEL
=========================================*/

function fakePrediction(data){

    /*
      Temporary equation.

      Later this function will be
      replaced by the real XGBoost API.
    */

    return (

        data.length*0.80 +

        data.height*1.15 +

        data.Thickness*5.4 +

        data.totaltyrestacks*9.5 +

        data.shapeFactor*55 +

        data.aspectRatio*120

    );

}


/*=========================================
        PREDICT
=========================================*/

predictButton.addEventListener("click",()=>{

    const data = getInputs();

    if(!validateInputs(data)){

        return;

    }

    predictButton.classList.add("loading");

    predictButton.innerHTML =
    "Running XGBoost Model";



    setTimeout(()=>{

        const result =
        fakePrediction(data);

        animatePrediction(result);

        predictButton.classList.remove("loading");

        predictButton.innerHTML =
        "Predict Horizontal Stiffness";

    },1500);

});
