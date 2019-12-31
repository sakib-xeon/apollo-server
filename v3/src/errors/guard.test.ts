import { guard, Comparison, check } from "./guard";
import { fail } from "./fail";

describe("guard", () => {
  it("asserts conditions", () => {
    const a = "hello";
    expect(() => {
      guard(a !== a);
    }).toThrowErrorMatchingInlineSnapshot(`"Assertion failed"`);
  });

  it("passes when condition ok", () => {
    const a = "hello";
    expect(() => {
      guard(a === a);
    }).not.toThrow();
  });

  it(".instance asserts instanceof", () => {
    expect(() => {
      guard.instance(2, String);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Assertion failed: 2 instanceof String"`
    );
  });

  it(".instance passes when ok", () => {
    expect(() => {
      guard.instance(new String("hello"), String);
    }).not.toThrow();
  });

  it("optionally takes a failure to throw if the guard fails", () => {
    const E_CLIENT_INVALID = fail("CLIENT_INVALID").msg(
      (props: { client: string | undefined }) =>
        `Client ${props.client} invalid`
    );
    expect(() => {
      guard(null, E_CLIENT_INVALID({ client: undefined }));
    }).toThrowErrorMatchingInlineSnapshot(`
"Client undefined invalid

Assertion failed"
`);
  });
});

describe("check", () => {
  const comparisons: Comparison[] = [
    "<",
    ">",
    "==",
    "===",
    "!=",
    "!==",
    "<=",
    ">="
  ];

  it.each([
    ...(function*() {
      const obj = {};
      const examples = new Map<any, any>();
      examples.set(0, [-1, 1, 0, 100, -Infinity, Infinity]);
      examples.set("hello", ["hello", "", obj]);
      examples.set(obj, [{}, obj, "a string"]);
      for (const lhs of examples.keys()) {
        for (const rhs of examples.get(lhs)) {
          for (const op of comparisons) {
            yield [lhs, op, rhs];
          }
        }
      }
    })()
  ])("compares %s %s %s", (lhs, op, rhs) => {
    const compare = eval(`((lhs, rhs) => lhs ${op} rhs)`);
    const run = expect(() => {
      check(lhs, op as Comparison, rhs);
    });
    if (compare(lhs, rhs)) {
      run.not.toThrow();
    } else {
      run.toThrowError(`Assertion failed: ${lhs} ${op} ${rhs}`);
    }
  });

  it("optionally, takes a failure to throw if the check fails", () => {
    const maxRate = 1000;
    const rate = 9999;
    const client = "a-client";

    const E_TOO_FAST = fail("TOO_FAST").msg(
      (props: { maxRate: number; rate: number; client: string }) =>
        `Client ${props.client} exceeded ${props.maxRate} with rate=${props.rate}`
    );

    expect(() => {
      check(rate, "<=", maxRate, E_TOO_FAST({ maxRate, rate, client }));
    }).toThrowErrorMatchingInlineSnapshot(`
"Client a-client exceeded 1000 with rate=9999

Assertion failed: 9999 <= 1000"
`);
  });
});