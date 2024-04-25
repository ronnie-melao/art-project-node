// Client side validation here, JQuery is available.
let $search_input = $("#search-input");
$search_input.on("input", _ => {
  $("#search-button").prop("disabled", !$search_input.val());
});