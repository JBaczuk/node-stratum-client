import StratumClient from "./StratumClient"

describe("StratumClient", () => {
  it("should instantiate", () => {
    const client = new StratumClient()
    expect(client).not.toBeNull()
  })
})
