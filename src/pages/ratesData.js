import { Card, Container, Grid, Text } from "@nextui-org/react";
import Head from "next/head";
import { useEffect, useState } from "react";

const { ethers, Contract } = require("ethers");

// GLOBAL CONSTS
const RAY = 10 ** 27; // 10 to the power 27
const SECONDS_PER_YEAR = 31536000;
const WEI_DECIMALS = 10 ** 18; // All emissions are in wei units, 18 decimal places
const INFURA_ID = process.env.NEXT_PUBLIC_INFURA_KEY; // TODO: put in env
// Contracts
// AAVE Lending pool: The central contract of Aave (it is the heart of every aave ERC20 token)
const AAVE_V2_LENDING_POOL = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
const AAVE_V2_LENDING_POOL_ABI = [
  "function getReserveData(address) view returns ((uint256, uint128, uint128, uint128, uint128, uint128, uint40, address, address, address, address, uint8))",
];
const AAVE_V2_IC = "0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5";
const AAVE_V2_IC_ABI = [
  "function getAssetData(address) view returns ((uint256, uint256, uint256))",
];
const COMET_USDC = "0xc3d688B66703497DAA19211EEdff47f25384cdc3";
const COMET_ABI = [
  "function getSupplyRate(uint) view returns (uint64)",
  "function getBorrowRate(uint) view returns (uint64)",
  "function getUtilization() view returns (uint)",
];
// EthersJS objects
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_ID}`
);
const AAVE_V2_LENDING_POOL_Contract = new ethers.Contract(
  AAVE_V2_LENDING_POOL,
  AAVE_V2_LENDING_POOL_ABI,
  provider
);
const AAVE_INCENTIVES_CONTROLLER = new ethers.Contract(
  AAVE_V2_IC,
  AAVE_V2_IC_ABI,
  provider
);
const COMET_USDC_Contract = new ethers.Contract(
  COMET_USDC,
  COMET_ABI,
  provider
);

const getApySeconds = (apr) => {
  return (1 + apr / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1;
};
// TODO: put addresses in another file
const getAaveRates = async (token) => {
  let address;
  switch (token) {
    case "usdc":
      console.log("USDC stuff");
      // HARD CODE FOR NOW
      address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  }

  // get the token data
  const resp = await AAVE_V2_LENDING_POOL_Contract.getReserveData(address);
  // log the response
  console.log(resp);
  // destructure components
  const [
    ,
    liquidityIndex,
    variableBorrowIndex,
    liquidityRate,
    variableBorrowRate,
    stableBorrowRate,
    ,
    aTokenAddress,
    stableDebtTokenAddress,
    variableDebtTokenAddress,
    ,
  ] = resp;
  console.log(aTokenAddress);
  // Get the aToken data
  const [, aEmissionPerSecond] = await AAVE_INCENTIVES_CONTROLLER.getAssetData(
    aTokenAddress
  );
  const [, vEmissionPerSecond] = await AAVE_INCENTIVES_CONTROLLER.getAssetData(
    stableDebtTokenAddress
  );
  const [, sEmissionPerSecond] = await AAVE_INCENTIVES_CONTROLLER.getAssetData(
    variableDebtTokenAddress
  );

  // return borrow and lending rates
  const depositAPR = liquidityRate / RAY;
  const variableBorrowAPR = variableBorrowRate / RAY;
  const stableBorrowAPR = stableBorrowRate / RAY;

  const depositAPY = getApySeconds(depositAPR);
  const variableBorrowAPY = getApySeconds(variableBorrowAPR);
  const stableBorrowAPY = getApySeconds(stableBorrowAPR);

  console.log("depositAPR: ", depositAPR);
  console.log("variableBorrowAPR: ", variableBorrowAPR);
  console.log("stableBorrowAPR: ", stableBorrowAPR);
  console.log("depositAPY: ", depositAPY);
  console.log("variableBorrowAPY: ", variableBorrowAPY);
  console.log("stableBorrowAPY: ", stableBorrowAPY);
  // Incentives calculation

  //const aEmissionPerYear = aEmissionPerSecond * SECONDS_PER_YEAR;
  //const vEmissionPerYear = vEmissionPerSecond * SECONDS_PER_YEAR;

  // UNDERLYING_TOKEN_DECIMALS will be the decimals of token underlying the aToken or debtToken
  // For Example, UNDERLYING_TOKEN_DECIMALS for aUSDC will be 10**6 because USDC has 6 decimals

  //   const incentiveDepositAPRPercent =
  //     (100 * (aEmissionPerYear * REWARD_PRICE_ETH * WEI_DECIMALS)) /
  //     (totalATokenSupply * TOKEN_PRICE_ETH * UNDERLYING_TOKEN_DECIMALS);

  //   const incentiveBorrowAPRPercent =
  //     (100 * (vEmissionPerYear * REWARD_PRICE_ETH * WEI_DECIMALS)) /
  //     (totalCurrentVariableDebt * TOKEN_PRICE_ETH * UNDERLYING_TOKEN_DECIMALS);

  //   console.log(incentiveDepositAPRPercent);
  //   console.log(incentiveBorrowAPRPercent);
  return {
    depositAPR: depositAPR,
    variableBorrowAPR: variableBorrowAPR,
    stableBorrowAPR: stableBorrowAPR,
    depositAPY: depositAPY,
    variableBorrowAPY: variableBorrowAPY,
    stableBorrowAPY: stableBorrowAPY,
  };
};

const getCompoundRates = async () => {
  const utilization = await COMET_USDC_Contract.getUtilization();
  const supplyRate = await COMET_USDC_Contract.getSupplyRate(utilization);
  const depositAPR = (supplyRate / WEI_DECIMALS) * SECONDS_PER_YEAR;

  const borrowRate = await COMET_USDC_Contract.getBorrowRate(utilization);
  const borrowAPR = (borrowRate / WEI_DECIMALS) * SECONDS_PER_YEAR;
  const depositAPY = getApySeconds(depositAPR);
  const borrowAPY = getApySeconds(borrowAPR);
  console.log("utilization:", utilization);
  console.log("supplyRate", supplyRate);
  console.log("borrowRate", borrowRate);
  console.log("depositAPR", depositAPR);
  console.log("borrowAPR", borrowAPR);
  console.log("depositAPY", depositAPY);
  console.log("borrowAPY", borrowAPY);
  return {
    depositAPR: depositAPR,
    borrowAPR: borrowAPR,
    depositAPY: depositAPY,
    borrowAPY: borrowAPY,
  };
};

export default function Home() {
  const [data, setData] = useState({});
  const [cdata, setcData] = useState({});
  const getRateData = async () => {
    try {
      const blockLookback = 2048;

      // By blocks as of now
      const current_block = await provider.getBlockNumber();
      // get current ethereum block
      console.log(`\nCurrent Block: ${current_block}\n`);
      // get the usdc pool rates
      const resp = await getAaveRates("usdc");
      const compound_resp = await getCompoundRates();
      setData(resp);
      setcData(compound_resp);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getRateData();
  }, []);

  return (
    <>
      <Head>
        <title>Data App</title>
      </Head>
      <main>
        <h1>USDC Rates DATA</h1>
        <div>
          <Container fluid>
            <Text h2 b>
              AAVE POOL data:
            </Text>
            <Grid.Container gap={2} justify="center">
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>DEPOSIT APR</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{data.depositAPR}</Text>
                  </Card.Body>
                </Card>
              </Grid>
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>BORROW APR (variable)</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{data.variableBorrowAPR}</Text>
                  </Card.Body>
                </Card>
              </Grid>
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>BORROW APR (stable)</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{data.stableBorrowAPR}</Text>
                  </Card.Body>
                </Card>
              </Grid>
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>DEPOSIT APY</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{data.depositAPY}</Text>
                  </Card.Body>
                </Card>
              </Grid>
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>BORROW APY (variable)</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{data.variableBorrowAPY}</Text>
                  </Card.Body>
                </Card>
              </Grid>
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>BORROW APY (stable)</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{data.stableBorrowAPY}</Text>
                  </Card.Body>
                </Card>
              </Grid>
            </Grid.Container>
          </Container>
        </div>

        <div>
          <Container fluid>
            <Text h2 b>
              COMPOUND POOL data:
            </Text>
            <Grid.Container gap={2} justify="center">
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>DEPOSIT APR</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{cdata.depositAPR}</Text>
                  </Card.Body>
                </Card>
              </Grid>
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>BORROW APR</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{cdata.borrowAPR}</Text>
                  </Card.Body>
                </Card>
              </Grid>
            </Grid.Container>
            <Grid.Container gap={2} justify="center">
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>DEPOSIT APY</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{cdata.depositAPY}</Text>
                  </Card.Body>
                </Card>
              </Grid>
              <Grid xs={4}>
                <Card css={{ mw: "400px" }}>
                  <Card.Header>
                    <Text h2>BORROW APY</Text>
                  </Card.Header>
                  <Card.Body>
                    <Text>{cdata.borrowAPY}</Text>
                  </Card.Body>
                </Card>
              </Grid>
            </Grid.Container>
          </Container>
        </div>
      </main>
    </>
  );
}
