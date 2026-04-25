import { Parser } from 'expr-eval';
const parser = new Parser();
try {
  console.log("Evaluating 2x with x=3:");
  console.log(parser.evaluate("2x", { x: 3 }));
} catch (e) {
  console.log("Error:", e.message);
}

try {
  console.log("Evaluating 2*x with x=3:");
  console.log(parser.evaluate("2*x", { x: 3 }));
} catch (e) {
  console.log("Error:", e.message);
}
