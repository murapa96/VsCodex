(function () {
  const vscode = acquireVsCodeApi();

  /* TABS */
  document
    .getElementById("generateTab")
    ?.addEventListener("click", () => changeMode("generateConfig"));
  document
    .getElementById("insertTab")
    ?.addEventListener("click", () => changeMode("insertConfig"));
  document
    .getElementById("editTab")
    ?.addEventListener("click", () => changeMode("editConfig"));

  /* OPTIONS */
  /*MODEL*/
  var model = document.getElementById("model");
  /*TEXT*/
  var stopSequence = document.getElementById("stopSequence");
  var transformInstructions = document.getElementById("transformInstructions");

  /* INPUTS */
  var temperature_input = document.getElementById("temperature_input");
  var max_tokens_input = document.getElementById("max_tokens_input");
  var top_p_input = document.getElementById("top_p_input");
  var frequency_penalty_input = document.getElementById(
    "frequency_penalty_input"
  );
  var presence_penalty_input = document.getElementById(
    "presence_penalty_input"
  );

  /* SLIDERS */
  var temperature_slider = document.getElementById("temperature_slider");
  var max_tokens_slider = document.getElementById("max_tokens_slider");
  var top_p_slider = document.getElementById("top_p_slider");
  var frequency_penalty_slider = document.getElementById(
    "frequency_penalty_slider"
  );
  var presence_penalty_slider = document.getElementById(
    "presence_penalty_slider"
  );

  /* SUBMIT EVENT */
  model?.addEventListener("change", submit);
  stopSequence?.addEventListener("change", submit);
  transformInstructions?.addEventListener("change", submit);
  temperature_slider?.addEventListener("change", submit);
  max_tokens_slider?.addEventListener("change", submit);
  top_p_slider?.addEventListener("change", submit);
  frequency_penalty_slider?.addEventListener("change", submit);
  presence_penalty_slider?.addEventListener("change", submit);

  /* SLIDER/INPUT SHARED VALUE */

  function set_listeners(input, slider) {
    input?.addEventListener("change", function () {
      //Check if input value is greater than the slider max.
      if (input.value > slider.max) {
        input.value = slider.max;
      }

      //Check if input value is less than the slider min.
      if (input.value < slider.min) {
        input.value = slider.min;
      }

      //Update the slider value.
      slider.value = input.value;
      submit();
    });

    slider?.addEventListener("input", function () {
      input.value = slider.value;
    });
  }

  set_listeners(temperature_input, temperature_slider);
  set_listeners(max_tokens_input, max_tokens_slider);
  set_listeners(top_p_input, top_p_slider);
  set_listeners(frequency_penalty_input, frequency_penalty_slider);
  set_listeners(presence_penalty_input, presence_penalty_slider);

  function submit() {
    // TODO: Fill in other result properties.
    console.log("SUBMIT!!");
    const result = {
      temperature: parseFloat(temperature_slider?.value),
      max_tokens: parseFloat(max_tokens_slider?.value),
      stopSequence: stopSequence?.value.replaceAll("\\n", "\n").split(","),
      top_p: parseFloat(top_p_slider?.value),
      frequency_penalty: parseFloat(frequency_penalty_slider?.value),
      presence_penalty: parseFloat(presence_penalty_slider?.value),
      model: model?.value,
      transformInstructions: transformInstructions?.value,
    };
    vscode.postMessage({ command: "submit", value: result });
  }

  function changeMode(mode) {
    vscode.postMessage({ command: "change_mode", value: mode });
  }
})();
