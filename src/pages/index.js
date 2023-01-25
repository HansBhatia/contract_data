import Head from "next/head";
import { useState } from "react";
import { CSVLink } from "react-csv";
const { ethers } = require("ethers");

export default function Home() {
  const [tokenData, setTokenData] = useState({});
  const [display, setDisplay] = useState(false);
  const csvData = [
    ["firstname", "lastname", "email"],
    ["Ahmed", "Tomi", "ah@smthing.co.com"],
    ["Raed", "Labes", "rl@smthing.co.com"],
    ["Yezzi", "Min l3b", "ymin@cocococo.com"],
  ];

  const getERC20Data = async (addr) => {
    try {
      setDisplay(false);
      setTokenData({});
      const address = addr.target.value;
      const INFURA_ID = "8a5ac880d65140ef9fdae38efa7b12af";
      const provider = new ethers.providers.JsonRpcProvider(
        `https://mainnet.infura.io/v3/${INFURA_ID}`
      );

      const ERC20_ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint)",
      ];

      const contract = new ethers.Contract(address, ERC20_ABI, provider);

      const name = await contract.name();
      const symbol = await contract.symbol();
      const totalSupply = await contract.totalSupply();

      console.log(`\nReading from ${address}\n`);
      console.log(`Name: ${name}`);
      console.log(`Symbol: ${symbol}`);
      console.log(`Total Supply: ${totalSupply}\n`);

      setTokenData({
        name: name,
        symbol: symbol,
        totalSupply: totalSupply.toString(),
      });
      // If we are here then the query was successfull
      setDisplay(true);
      console.log(tokenData);
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
        <h1>ERC20 CONTRACT DATA</h1>
        <div>Contract Address:</div>
        <input
          onChange={getERC20Data}
          type="text"
          id="addr"
          name="addr"
          placeholder="0x..."
        />
        {display && (
          <div>
            <h1>{tokenData.name}</h1>
            <p>Symbol: {tokenData.symbol}</p>
            <p>Total Supply: {tokenData.totalSupply}</p>
            <CSVLink
              data={csvData}
              filename={tokenData.symbol + ".csv"}
              className="btn btn-primary"
              target="_blank"
            >
              Download CSV
            </CSVLink>
          </div>
        )}
      </main>
    </>
  );
}
