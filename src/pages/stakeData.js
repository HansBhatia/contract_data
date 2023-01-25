import Head from "next/head";
const { ethers } = require("ethers");

export default function SD() {
  // Since there is limited access to the beacon chain, I will get incoming stakers through the Eth1 contract where validators
  // initially deposit their stake which notifies the beaconchain
  const getETH2Data = async (addr) => {
    try {
      // Access node
      const INFURA_ID = process.env.NEXT_PUBLIC_INFURA_KEY;
      const provider = new ethers.providers.JsonRpcProvider(
        `https://mainnet.infura.io/v3/${INFURA_ID}`
      );

      // consts
      //
      const blockLookback = 2048;
      const ETHDepositContractAddr =
        "0x00000000219ab540356cBB839Cbe05303d7705Fa";
      const ETHDepositContractABI = [
        "event DepositEvent(bytes pubkey, bytes withdrawal_credentials, bytes amount, bytes signature, bytes index)",
      ];
      const ETHDepositContract = new ethers.Contract(
        ETHDepositContractAddr,
        ETHDepositContractABI,
        provider
      );

      // By blocks as of now
      const current_block = await provider.getBlockNumber();

      const DepositEvents = await ETHDepositContract.queryFilter(
        "DepositEvent",
        current_block - blockLookback,
        current_block
      );

      // get current ethereum block
      console.log(`\nCurrent Block: ${current_block}\n`);
      // Get the events within the last 100 blocks
      console.log(DepositEvents);
      // ROUGH NOTES
      // const bytes = "0040597307000000";
      // console.log(parseInt(bytes.slice(0, 2), 16))
      // const bytesObject = Buffer.from([0x00, 0x40, 0x59, 0x73, 0x07, 0x00, 0x00, 0x00]);
      // //00A0ACB903000000
      // //0040597307000000
      // const uint64 = bytesObject.readUIntLE(0, 8);
      // console.log(uint64 / 10**9);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Head>
        <title>Data App</title>
      </Head>
      <main>
        <h1>ETH2 Realtime DATA</h1>
        <div>Contract Address:</div>
        <input
          onChange={getETH2Data}
          type="text"
          id="addr"
          name="addr"
          placeholder="0x..."
        />
        <div>
          {/* <h1>{tokenData.name}</h1>
            <p>Symbol: {tokenData.symbol}</p>
            <p>Total Supply: {tokenData.totalSupply}</p> */}
        </div>
      </main>
    </>
  );
}
