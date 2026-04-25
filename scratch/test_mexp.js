import Mexp from 'math-expression-evaluator';
const mexp = new Mexp();
try {
  console.log("Evaluating 2x with x=3:");
  // The variables array is the second argument to lex, then toPostfix, then postfixEval
  // Actually, the instance method eval(str, tokens, pair)
  // Let's see the prototype.eval: function(t,e,i) { return this.postfixEval(this.toPostfix(this.lex(t,e)),i) }
  // t: string, e: tokens array, i: pair? 
  // Wait, let's look at the source or docs.
  // Docs say: mexp.eval(str, variables) where variables is [{name: 'x', value: 2}]
  console.log(mexp.eval("2x", [{ name: 'x', value: 3 }]));
} catch (e) {
  console.log("Error:", e.message);
}
