const Mexp = require('math-expression-evaluator');
try {
  console.log("Testing 2*x:");
  console.log(Mexp.eval("2*x", [{ name: 'x', value: 5 }]));
} catch (e) {
  console.log("Error 2*x:", e.message);
}

try {
  console.log("Testing 2x:");
  console.log(Mexp.eval("2x", [{ name: 'x', value: 5 }]));
} catch (e) {
  console.log("Error 2x:", e.message);
}
