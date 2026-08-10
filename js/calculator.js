/* ==========================================================
   Hybrid FEM-ML Horizontal Stiffness Predictor
   FINAL WEB DEPLOYMENT
   Model: Direct CatBoost
   Inputs: 8
   Output: Horizontal Stiffness (N/mm)

   IMPORTANT:
   Rubber Thickness =
   "Thickness of rubber\ntr (mm)"
   ========================================================== */

const MODEL_PATH = "models/horizontal_stiffness_catboost.onnx";

const predictButton = document.getElementById("predictBtn");
const predictionValue = document.getElementById("predictionValue");

const detailsButton = document.getElementById("toggleDetails");
const detailsSection = document.getElementById("detailsSection");

let ortSession = null;


/* ==========================================================
   DETAILS TOGGLE
   ========================================================== */

if (detailsButton && detailsSection) {

    detailsButton.addEventListener("click", () => {

        detailsSection.classList.toggle("active");

        if (detailsSection.classList.contains("active")) {
            detailsButton.innerHTML = "Hide Details ▲";
        } else {
            detailsButton.innerHTML = "Show Details ▼";
        }

    });

}


/* ==========================================================
   LOAD CATBOOST ONNX MODEL
   ========================================================== */

async function loadModel() {

    try {

        console.log("Loading CatBoost ONNX model...");

        ortSession = await ort.InferenceSession.create(
            MODEL_PATH,
            {
                executionProviders: ["wasm"]
            }
        );

        console.log("CatBoost ONNX model loaded.");

        console.log(
            "Input names:",
            ortSession.inputNames
        );

        console.log(
            "Output names:",
            ortSession.outputNames
        );

    }

      catch (error) {
   
       console.error("FAILED TO LOAD MODEL");
       console.error(error);
       console.error("MODEL PATH:", MODEL_PATH);
   
       alert(
           "Model loading failed. Open F12 → Console and check the exact error."
       );
      }

}


/* ==========================================================
   GET INPUTS
   ========================================================== */

function getInputs() {

    return [

        Number(
            document.getElementById(
                "bonding_condition"
            ).value
        ),

        Number(
            document.getElementById(
                "length"
            ).value
        ),

        Number(
            document.getElementById(
                "height"
            ).value
        ),

        Number(
            document.getElementById(
                "Thickness"
            ).value
        ),

        Number(
            document.getElementById(
                "eq_Thickness"
            ).value
        ),

        Number(
            document.getElementById(
                "totaltyrestacks"
            ).value
        ),

        Number(
            document.getElementById(
                "shapeFactor"
            ).value
        ),

        Number(
            document.getElementById(
                "aspectRatio"
            ).value
        )

    ];

}


/* ==========================================================
   VALIDATION
   ========================================================== */

function validateInputs(values) {

    for (const value of values) {

        if (!Number.isFinite(value)) {

            alert(
                "Please fill all 8 input parameters."
            );

            return false;
        }

    }

    /* Bonding condition must be 0 or 1 */

    if (
        values[0] !== 0 &&
        values[0] !== 1
    ) {

        alert(
            "Bonding condition must be either 0 or 1."
        );

        return false;
    }


    /* Physical dimensions must be positive */

    const positiveInputs = [
        values[1], // Length
        values[2], // Height
        values[3], // Rubber thickness
        values[4], // Equivalent rubber thickness
        values[5], // Tire stacks
        values[6], // Shape factor
        values[7]  // Aspect ratio
    ];

    for (const value of positiveInputs) {

        if (value <= 0) {

            alert(
                "All dimensional and geometric parameters must be greater than zero."
            );

            return false;
        }

    }

    return true;

}


/* ==========================================================
   ANIMATE RESULT
   ========================================================== */

function animatePrediction(target) {

    const duration = 800;

    const startValue = 0;

    const startTime = performance.now();

    function update(currentTime) {

        const elapsed =
            currentTime - startTime;

        const progress =
            Math.min(elapsed / duration, 1);

        const value =
            startValue +
            (target - startValue) * progress;

        predictionValue.textContent =
            value.toFixed(2) + " N/mm";

        if (progress < 1) {

            requestAnimationFrame(update);

        }

    }

    requestAnimationFrame(update);

}


/* ==========================================================
   RUN CATBOOST PREDICTION
   ========================================================== */

async function predictStiffness(values) {

    if (!ortSession) {

        throw new Error(
            "ONNX model has not finished loading."
        );

    }

    /*
       CatBoost was trained with exactly 8 features
       in this order:

       1. Bonding Condition
       2. Length
       3. Height
       4. Rubber Thickness
       5. Equivalent Rubber Thickness
       6. Total Tire Stacks
       7. Shape Factor
       8. Aspect Ratio
    */

    const inputData = new Float32Array(values);

    const inputTensor =
        new ort.Tensor(
            "float32",
            inputData,
            [1, 8]
        );

    const inputName =
        ortSession.inputNames[0];

    const outputName =
        ortSession.outputNames[0];

    const feeds = {};

    feeds[inputName] =
        inputTensor;

    const results =
        await ortSession.run(feeds);

    const output =
        results[outputName];

    const prediction =
        Number(output.data[0]);

    if (!Number.isFinite(prediction)) {

        throw new Error(
            "Model returned an invalid prediction."
        );

    }

    return prediction;

}


/* ==========================================================
   PREDICT BUTTON
   ========================================================== */

predictButton.addEventListener(
    "click",
    async () => {

        const values =
            getInputs();

        if (!validateInputs(values)) {
            return;
        }

        predictButton.disabled = true;

        predictButton.classList.add(
            "loading"
        );

        predictButton.innerHTML =
            "Running CatBoost Model...";

        try {

            const result =
                await predictStiffness(
                    values
                );

            animatePrediction(
                result
            );

            console.log(
                "Horizontal stiffness:",
                result,
                "N/mm"
            );

        }

        catch (error) {

            console.error(
                "Prediction error:",
                error
            );

            alert(
                "Prediction failed. Check that the ONNX model is available."
            );

            predictionValue.textContent =
                "-- N/mm";

        }

        finally {

            predictButton.disabled =
                false;

            predictButton.classList.remove(
                "loading"
            );

            predictButton.innerHTML =
                "Predict Horizontal Stiffness";

        }

    }
);


/* ==========================================================
   INITIALIZE
   ========================================================== */

loadModel();
