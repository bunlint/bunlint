// Example class (violates no-class rule)
/*
class User {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}
*/

// Example functional approach
type CounterState = { value: number };

const createCounter = (initialValue: number): CounterState => ({ value: initialValue });

const incrementCounter = (counter: CounterState): CounterState => (
  { value: counter.value + 1 }
);

const counter = createCounter(0);
// const newCounter = incrementCounter(counter); // Removed unused variable

const numbers = [1, 2, 3, 4];
// const newNumbers = [...numbers, 5]; // Removed unused variable

const config = { setting: true };
// const newConfig = { // Removed unused variable
//   ...config,
//   anotherSetting: false,
// };

// Example loop (violates no-loops rule)
/*
let sum = 0;
for (let i = 0; i < numbers.length; i++) {
  sum += numbers[i];
}
*/

// Example array mutation (violates no-mutation rule)
/*
const mutableArray = [1, 2];
mutableArray.push(3);
*/

// Example object mutation (violates no-mutation rule)
/*
const mutableObject = { a: 1 };
mutableObject.a = 2;
*/

// Example usage of 'let' (violates prefer-const rule)
/*
let count = 0;
count = 1;
*/

// Example usage of 'this' (violates no-this rule)
/*
function greet() {
  // console.log(`Hello, my name is ${this.name}`); // Requires 'this' context
}
*/ 