import Mexp from 'math-expression-evaluator';
const mexp = new Mexp();

try {
  const expression = "2x + 1";
  console.log("Lexing expression:", expression);
  
  // Lex expects (string, tokens)
  // Tokens can be an array of variable objects
  const tokens = [{ name: 'x', type: 3, value: '3' }]; // Type 3 is variable?
  
  // Actually, there's a simpler way if we use the version 2.x
  // Let's try the static Mexp if it exists, or instance
  
  const result = mexp.eval("2x + 1", [{ name: 'x', value: 3 }]);
  console.log("Result for x=3:", result);
  
  const result2 = mexp.eval("x^2", [{ name: 'x', value: 4 }]);
  console.log("Result for x^2 with x=4:", result2);

  const result3 = mexp.eval("sin(x)", [{ name: 'x', value: Math.PI / 2 }]);
  console.log("Result for sin(x) with x=PI/2:", result3);

} catch (e) {
  console.log("Error:", e.message);
  console.log(e.stack);
}
