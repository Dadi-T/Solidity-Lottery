const assert = require("assert");
const Web3 = require("web3");
const ganache = require("ganache-cli");

const provider = ganache.provider();
const web3 = new Web3(provider);
const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });

  lottery.setProvider(provider);
});

describe("lottery Contract", () => {
  it("deployment", () => {
    assert.ok(lottery.options.address);
  });

  it("Can participate", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.2", "ether"),
    });
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("0.2", "ether"),
    });
    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("0.2", "ether"),
    });
    const players = await lottery.methods.getPlayers().call();

    for (let index = 0; index < 3; index++) {
      assert.equal(accounts[index], players[index]);
    }

    assert.equal(3, players.length);
  });

  it("requires at least 0.01 ether to enter", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei("0.00001", "ether"),
      });
    } catch (error) {
      assert(error);
    }
  });

  it("requires manager to run pickWinner", async () => {
    try {
      //send because it sends money
      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });
    } catch (error) {
      assert(error);
    }
  });

  it("gets money when it wins, and initilize players arrays", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });
    /* Contract balance check up starts */
    let contractBalance = await web3.eth.getBalance(lottery.options.address);
    assert(0 < web3.utils.fromWei(contractBalance));
    /* Contract balance check up Ends */

    /* Players check up starts */
    let players = await lottery.methods.getPlayers().call();
    assert.equal(1, players.length);
    /* Players check up ends */

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    //send because it sends money
    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    assert(difference > web3.utils.toWei("1.8", "ether"));

    /* Players check up starts */
    players = await lottery.methods.getPlayers().call();
    assert.equal(0, players.length);
    /* Players check up ends */

    /* Contract balance check up starts */
    contractBalance = await web3.eth.getBalance(lottery.options.address);
    assert.equal(0, web3.utils.fromWei(contractBalance));
    /* Contract balance check up starts */
  });
});
