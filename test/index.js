// This test file uses the tape testing framework.
// To learn more, go here: https://github.com/substack/tape
const { Config, Scenario } = require("@holochain/holochain-nodejs")
Scenario.setTape(require("tape"))

const dnaPath = "./dist/bundle.json"
const agentAlice = Config.agent("alice")
const dna = Config.dna(dnaPath)
const instanceAlice = Config.instance(agentAlice, dna)
const scenario = new Scenario([instanceAlice], { debugLog: true })

const address_a = "QmdTMLkxJPe7CTrVnixBMfX196h8zGWFgReWvkb7smTCup"
const address_b = "QmbckNj1tikTqzP7zyLMavaYJQxgeLPrds33Jser9CrB95"

scenario.runTape("Try to create an entry", (t, { alice }) => {
  // Make a call to a Zome function
  // indicating the function, and passing it an input
  const addr = alice.call("holotw", "create_tiddler", {"title":"Tiddler Title A",
        "text":"Tiddler Text A"})
  
  // check for equality of the actual and expected results
  t.deepEqual(addr, { Ok: address_a })
})

scenario.runTape("Try to create and retrieve entry", (t, { alice }) => {
  // Make a call to a Zome function
  // indicating the function, and passing it an input
  const addr = alice.call("holotw", "create_tiddler", {"title":"Tiddler Title A",
        "text":"Tiddler Text A"})
  const result = alice.call("holotw", "get_tiddler", {"address": addr.Ok})
  
  // check for equality of the actual and expected results
  t.deepEqual(result, { Ok: { App: [ 'tiddler', '{"title":"Tiddler Title A","text":"Tiddler Text A"}' ] } })
})

scenario.runTape("use the update_entry function to update an existing tiddler entry", (t, { alice }) => {
  let result
  try {
    const addr = alice.call("holotw", "create_tiddler", {"title":"Tiddler Title A",
        "text":"Tiddler Text A"})
    result = alice.call("holotw", "update_tiddler", {
      address: address_a,
      title: "Tiddler Title B",
      text: "Tiddler Text B"
    })
  } catch (e) {}
  t.deepEqual(result, { Ok: address_b })
})

scenario.runTape("use the remove_entry function to mark an existing tiddler entry as removed", (t, { alice }) => {
  // recall that nothing every gets deleted from the local source chain
  // because it is "append-only". Past entries are simply marked by future entries as having been removed
  // they are technically still retrievable
  let result
  try {
    alice.call("holotw", "create_tiddler", {"title":"Tiddler Title A",
        "text":"Tiddler Text A"})
    result = alice.call("holotw", "remove_tiddler", {address: address_a })
  } catch (e) {}
  t.deepEqual(result, { Ok: null })
})

scenario.runTape("use the query_results function to get a list of all the tiddlers in the dht", (t, { alice }) => {
  let result
  try {
    alice.call("holotw", "create_tiddler", {"title":"Tiddler Title A",
        "text":"Tiddler Text A"})
    alice.call("holotw", "create_tiddler", {"title":"Tiddler Title B",
        "text":"Tiddler Text B"})
    result = alice.call("holotw", "query_tiddlers", {})
  } catch (e) {}
  t.deepEqual(result.Ok.Entries, [ [ 'QmbckNj1tikTqzP7zyLMavaYJQxgeLPrds33Jser9CrB95', { App: [ 'tiddler', '{"title":"Tiddler Title B","text":"Tiddler Text B"}' ] } ], [ 'QmdTMLkxJPe7CTrVnixBMfX196h8zGWFgReWvkb7smTCup', { App: [ 'tiddler', '{"title":"Tiddler Title A","text":"Tiddler Text A"}' ] } ] ])
})