/* ==========================================================
   HYBRID FEM–ML HORIZONTAL STIFFNESS PREDICTOR
   FINAL WEB DEPLOYMENT

   Model:
   Direct CatBoost → ONNX

   Inputs:
   8 original features

   Output:
   Horizontal Stiffness (N/mm)

   ========================================================== */


/* ==========================================================
   MODEL PATH
   ========================================================== */

const MODEL_PATH =
    "models/horizontal_stiffness_catboost.onnx";


/* ==========================================================
   DOM ELEMENTS
   ========================================================== */

const predictButton =
    document.getElementById("predictBtn");

const predictionValue =
    document.getElementById("predictionValue");

const detailsButton =
    document.getElementById("toggleDetails");

const detailsSection =
    document.getElementById("detailsSection");


/* ==========================================================
   GLOBAL MODEL SESSION
   ========================================================== */

let ortSession = null;


/* ==========================================================
   DIAGNOSTIC GRAPH CONFIGURATION
   ==========================================================

   IMPORTANT:

   Upload your PNG files to the "models" folder in GitHub.

   Expected files:

   models/feature_importance.png
   models/actual_vs_predicted.png
   models/error_distribution.png
   models/residual_vs_predicted.png
   models/cross_validation_r2.png
   models/cross_validation_rmse.png
   models/model_statistics.png

   ========================================================== */

const DIAGNOSTIC_GRAPHS = [

    {
        title: "Feature Importance",
        file: "models/feature_importance.png",
        description:
            "Relative contribution of the eight input parameters to the CatBoost model."
    },

    {
        title: "Prediction vs Actual",
        file: "models/actual_vs_predicted.png",
        description:
            "Comparison between the finite-element stiffness values and the model predictions."
    },

    {
        title: "Error Distribution",
        file: "models/error_distribution.png",
        description:
            "Distribution of prediction errors obtained from the out-of-fold predictions."
    },

    {
        title: "Residual Distribution",
        file: "models/residual_vs_predicted.png",
        description:
            "Residuals plotted against predicted horizontal stiffness."
    },

    {
        title: "Cross-Validation R²",
        file: "models/cross_validation_r2.png",
        description:
            "R² obtained for each fold of the 15-fold cross-validation."
    },

    {
        title: "Cross-Validation RMSE",
        file: "models/cross_validation_rmse.png",
        description:
            "RMSE obtained for each fold of the 15-fold cross-validation."
    },

    {
        title: "Model Statistics",
        file: "models/model_statistics.png",
        description:
            "Summary of the final CatBoost model and its validation performance."
    }

];


/* ==========================================================
   DETAILS GRAPH RENDERER
   ========================================================== */

function renderDiagnosticGraphs() {

    const detailBoxes =
        document.querySelectorAll(
            ".detail-box"
        );

    if (!detailBoxes.length) {
        console.warn(
            "No .detail-box elements found."
        );

        return;
    }


    detailBoxes.forEach(
        (box, index) => {

            const graph =
                DIAGNOSTIC_GRAPHS[index];

            if (!graph) {
                return;
            }


            /* Clear existing content */

            box.innerHTML = "";


            /* Create graph title */

            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                graph.title;


            /* Create image */

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                graph.file;

            image.alt =
                graph.title;


            /*
               Make graph responsive.
               CSS can override this later.
            */

            image.style.width =
                "100%";

            image.style.height =
                "auto";

            image.style.display =
                "block";


            /*
               Error handling if image
               has not yet been uploaded.
            */

            image.onerror = function () {

                box.innerHTML = "";


                const missingTitle =
                    document.createElement(
                        "h3"
                    );

                missingTitle.textContent =
                    graph.title;


                const message =
                    document.createElement(
                        "p"
                    );

                message.textContent =
                    "Graph not available yet. Upload: " +
                    graph.file;


                message.style.opacity =
                    "0.65";


                box.appendChild(
                    missingTitle
                );

                box.appendChild(
                    message
                );

            };


            /* Create description */

            const description =
                document.createElement(
                    "p"
                );

            description.textContent =
                graph.description;


            /*
               Assemble box
            */

            box.appendChild(
                title
            );

            box.appendChild(
                image
            );

            box.appendChild(
                description
            );

        }
    );

}


/* ==========================================================
   DETAILS TOGGLE
   ========================================================== */

if (
    detailsButton &&
    detailsSection
) {

    detailsButton.addEventListener(
        "click",
        () => {

            const isActive =
                detailsSection.classList.toggle(
                    "active"
                );


            if (isActive) {

                detailsButton.innerHTML =
                    "Hide Details ▲";


                /*
                   Render graphs only when
                   details are opened.
                */

                renderDiagnosticGraphs();

            }

            else {

                detailsButton.innerHTML =
                    "Show Details ▼";

            }

        }
    );

}


/* ==========================================================
   LOAD CATBOOST ONNX MODEL
   ========================================================== */

async function loadModel() {

    try {

        console.log(
            "Loading CatBoost ONNX model..."
        );


        ortSession =
            await ort.InferenceSession.create(
                MODEL_PATH,
                {
                    executionProviders: [
                        "wasm"
                    ]
                }
            );


        console.log(
            "CatBoost ONNX model loaded successfully."
        );


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

        console.error(
            "FAILED TO LOAD MODEL"
        );

        console.error(
            error
        );

        console.error(
            "MODEL PATH:",
            MODEL_PATH
        );


        alert(
            "Model loading failed. " +
            "Open F12 → Console and check the exact error."
        );

    }

}


/* ==========================================================
   GET INPUT VALUES
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
   INPUT VALIDATION
   ========================================================== */

function validateInputs(values) {

    /* Check all values */

    for (
        const value of values
    ) {

        if (
            !Number.isFinite(value)
        ) {

            alert(
                "Please fill all 8 input parameters."
            );

            return false;

        }

    }


    /* Bonding condition */

    if (
        values[0] !== 0 &&
        values[0] !== 1
    ) {

        alert(
            "Bonding condition must be either 0 or 1."
        );

        return false;

    }


    /* Positive parameters */

    const positiveInputs = [

        values[1], // Length
        values[2], // Height
        values[3], // Rubber thickness
        values[4], // Equivalent rubber thickness
        values[5], // Tire stacks
        values[6], // Shape factor
        values[7]  // Aspect ratio

    ];


    for (
        const value of positiveInputs
    ) {

        if (
            value <= 0
        ) {

            alert(
                "All dimensional and geometric parameters " +
                "must be greater than zero."
            );

            return false;

        }

    }


    return true;

}


/* ==========================================================
   ANIMATE PREDICTION
   ========================================================== */

function animatePrediction(
    target
) {

    const duration =
        800;

    const startValue =
        0;

    const startTime =
        performance.now();


    function update(
        currentTime
    ) {

        const elapsed =
            currentTime -
            startTime;


        const progress =
            Math.min(
                elapsed / duration,
                1
            );


        const value =
            startValue +
            (
                target -
                startValue
            ) *
            progress;


        predictionValue.textContent =
            value.toFixed(2) +
            " N/mm";


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                update
            );

        }

    }


    requestAnimationFrame(
        update
    );

}


/* ==========================================================
   RUN CATBOOST PREDICTION
   ========================================================== */

async function predictStiffness(
    values
) {

    if (!ortSession) {

        throw new Error(
            "ONNX model has not finished loading."
        );

    }


    /*
       EXACT CATBOOST FEATURE ORDER

       1. Bonding Condition
       2. Length
       3. Height
       4. Rubber Thickness
       5. Equivalent Rubber Thickness
       6. Total Tire Stacks
       7. Shape Factor
       8. Aspect Ratio
    */


    const inputData =
        new Float32Array(
            values
        );


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
        await ortSession.run(
            feeds
        );


    const output =
        results[outputName];


    const prediction =
        Number(
            output.data[0]
        );


    if (
        !Number.isFinite(
            prediction
        )
    ) {

        throw new Error(
            "Model returned an invalid prediction."
        );

    }


    return prediction;

}


/* ==========================================================
   PREDICT BUTTON
   ========================================================== */

if (predictButton) {

    predictButton.addEventListener(
        "click",
        async () => {


            /* Get inputs */

            const values =
                getInputs();


            /* Validate */

            if (
                !validateInputs(
                    values
                )
            ) {

                return;

            }


            /* Disable button */

            predictButton.disabled =
                true;


            predictButton.classList.add(
                "loading"
            );


            predictButton.innerHTML =
                "Running CatBoost Model...";


            try {


                /* Run prediction */

                const result =
                    await predictStiffness(
                        values
                    );


                /* Animate */

                animatePrediction(
                    result
                );


                /* Console output */

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
                    "Prediction failed. " +
                    "Check that the ONNX model is available."
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

}


/* ==========================================================
   INITIALIZE
   ========================================================== */

loadModel();
