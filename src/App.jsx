import React, { useState, useRef } from 'react';
import { SigningStargateClient } from '@cosmjs/stargate';
import Papa from 'papaparse';
import logo from '../src/assets/cclogo.png'
import multisendimg from '../src/assets/multisend img.png'
import bg from '../src/assets/CC - Multi sender bg.png'
import connectwallet from '../src/assets/connect wallet button.png'
import txbutton from '../src/assets/tx button.png'

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [client, setClient] = useState(null);

  const [gasFee, setGasFee] = useState("200000");
  const [feeAmount, setFeeAmount] = useState("150");
  const [selectedDenom, setSelectedDenom] = useState("uzig");

  const [csvData, setCsvData] = useState([]);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Connect wallet via Leap
  const connectWallet = async () => {
    try {
      if (!window.leap) throw new Error("Leap wallet extension not found.");
      const chainId = "zig-test-1";
      await window.leap.enable(chainId);
      const signer = window.leap.getOfflineSigner(chainId);
      const accounts = await signer.getAccounts();
      if (!accounts.length) throw new Error("No accounts found in Leap wallet.");
      setAddress(accounts[0].address);
      const rpcUrl = "https://testnet-rpc.zigchain.com";
      const signingClient = await SigningStargateClient.connectWithSigner(rpcUrl, signer);
      setClient(signingClient);
      setWalletConnected(true);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Disconnect wallet and clear state
  const disconnectWallet = () => {
    setWalletConnected(false);
    setAddress('');
    setClient(null);
    setError('');
    setCsvData([]);
    setTransactionHash('');
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  // Handle CSV upload and parsing
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError("No file selected.");
      if (fileInputRef.current) fileInputRef.current.value = null;
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.filter(row => row.address && row.amount);
        if (!parsed.length) {
          setError("CSV is empty or missing 'address' and 'amount' headers.");
          setCsvData([]);
          if (fileInputRef.current) fileInputRef.current.value = null;
          return;
        }
        setCsvData(parsed);
        setError('');
      },
      error: (err) => {
        setError(`CSV parsing error: ${err.message}`);
        setCsvData([]);
        if (fileInputRef.current) fileInputRef.current.value = null;
      }
    });
  };

  // Build and broadcast multi-send transaction
  const handleMultiSend = async () => {
    if (!client || !walletConnected) {
      setError("Wallet not connected.");
      return;
    }
    if (!csvData.length) {
      setError("CSV data is empty.");
      return;
    }
    setError('');

    const recipients = csvData.map(row => {
      const amt = row.amount.trim();
      const amount = selectedDenom === 'uzig'
        ? Math.floor(Number(amt) * 1_000_000).toString()
        : amt;
      return { address: row.address.trim(), amount };
    });

    const totalAmount = recipients.reduce((sum, r) => sum + Number(r.amount), 0).toString();

    const msg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgMultiSend",
      value: {
        inputs: [{ address, coins: [{ denom: selectedDenom, amount: totalAmount }] }],
        outputs: recipients.map(r => ({ address: r.address, coins: [{ denom: selectedDenom, amount: r.amount }] }))
      }
    };

    const fee = { amount: [{ denom: 'uzig', amount: feeAmount }], gas: gasFee };

    try {
      const result = await client.signAndBroadcast(address, [msg], fee, 'MultiSend');
      setTransactionHash(result.transactionHash);
    } catch (err) {
      setError(`Transaction error: ${err.message}`);
    }
  };

  return (
    <div
      className="relative h-[100vh]"
      style={{
        fontFamily: '"Pink Chicken", cursive',
        backgroundImage: `url(${bg})`,
        backgroundPosition: "center",
      }}
    >
      <div className='container max-w-[85em] m-auto'>
        <header className="w-full flex justify-between items-center px-6 z-10">
          {/* TODO: Insert Crypto Comics logo image here */}
          <div><img className='w-[200px]' src={logo} alt="Crypto Comics" /></div>

          {!walletConnected ? (
            <button
              onClick={connectWallet}
              className="text-white font-bold px-6 py-2 rounded shadow-lg cursor-pointer"
              style={{
                fontFamily: '"Pink Chicken", cursive',
                backgroundImage: `url(${connectwallet})`,
                backgroundPosition: "center",
              }}
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              {/* truncate first 6 + last 4 chars with “…” */}
              <span className="bg-green-500 text-white px-4 py-2 rounded font-mono text-sm">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </span>
            </div>
          )}
        </header>

        <div className="h-[100%] flex lg:flex-row flex-col justify-center items-center ">
          <div className="items-center justify-center hidden md:flex">
            {/* TODO: Insert $ZIG MULTISENDER comic graphic here */}
            <div><img className='w-[500px]' src={multisendimg} alt="$Zig Multisender" /></div>
          </div>

          <div className="flex-1 max-w-[600px] mx-auto px-6">
            {error && (
              <div className="bg-red-200 text-red-800 p-3 mb-4 rounded">{error}</div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Token Denom to Multisend:
              </label>
              <input
                type="text"
                value={selectedDenom}
                onChange={e => setSelectedDenom(e.target.value)}
                className="w-full p-2 bg-purple-300 text-gray-900 rounded border-1 border-purple-500 "
                placeholder="e.g. uzig"
              />
            </div>

            {/* Gas Fee (Gas Limit) */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-pink-600 mb-2">
                Gas Fee (Gas Limit):
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={gasFee}
                  onChange={e => setGasFee(e.target.value)}
                  placeholder="Enter Gas Limit"
                  className="flex-1 border-1 border-[#FF5895] p-2 bg-pink-100 rounded-l-md text-gray-800 placeholder-pink-500"
                />
                <button
                  type="button"
                  className="bg-pink-500 text-white font-bold px-4 rounded-r-md"
                >
                  100%
                </button>
              </div>
            </div>

            {/* Transaction Fee Amount */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-blue-600 mb-2">
                Transaction Fee Amount (Uzig)
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={feeAmount}
                  onChange={e => setFeeAmount(e.target.value)}
                  placeholder="Uzig"
                  className="flex-1 p-2 border-1 border-[#43C9EF] bg-blue-100 rounded-l-md text-gray-800 placeholder-blue-500"
                />
                <button
                  type="button"
                  className="bg-blue-500 text-white font-bold px-4 rounded-r-md"
                >
                  Max
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Upload CSV (headers: address, amount)
              </label>
              <div className="border-2 relative border-dashed border-yellow-400 bg-yellow-50 rounded p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="opacity-0 absolute inset-0 cursor-pointer"
                />
                <div className="text-yellow-700 font-bold">Browse</div>
              </div>
            </div>

            {csvData.length > 0 && (
              <div className="mb-4 overflow-auto h-[10rem] bg-transparen p-4 rounded">
                <h2 className="font-bold mb-2 text-black">CSV Preview</h2>
                <table className="w-full text-sm border-1 border-[#E32B2B]">
                  <thead className='bg-[#e32b2b52]'>
                    <tr>
                      <th className="text-left px-[25px] py-4 border-b border-[#E32B2B] text-black">Address</th>
                      <th className="text-left px-[25px] py-4 border-b border-[#E32B2B] text-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody className='bg-[#e32b2b1c]'>
                    {csvData.map((r, i) => (
                      <tr key={i}>
                        <td className="px-[25px] py-4 border-b border-[#E32B2B] text-black">{r.address}</td>
                        <td className="px-[25px] py-4 border-b border-[#E32B2B] text-black">{r.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* <button
            onClick={handleMultiSend}
            className="w-full py-2font-bold rounded"
            style={{
              backgroundImage: 'url("../src/assets/connect wallet button.png")',
              backgroundPosition: "center",
            }}
          >
            Send Multisend Transaction
          </button> */}
            <div onClick={handleMultiSend} className='cursor-pointer'>
              <img src={txbutton} alt="" />
            </div>
            {transactionHash && (
              <div className="mt-4 p-3 bg-blue-800 text-white rounded flex items-center justify-between">
                <span className="font-mono text-sm">
                  TxHash:&nbsp;
                  {`${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(transactionHash)}
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
