import React, { useState } from 'react';
import { SigningStargateClient } from '@cosmjs/stargate';
import Papa from 'papaparse';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [client, setClient] = useState(null);


  const [gasFee, setGasFee] = useState("200000"); 
  const [feeAmount, setFeeAmount] = useState("150"); 

  const [csvData, setCsvData] = useState([]);


  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      if (!window.leap) {
        setError("Leap wallet extension not found. Please install Leap wallet.");
        return;
      }
      
      const chainId = "zig-test-1";

  
      await window.leap.enable(chainId);

      const offlineSigner = window.leap.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();
      if (!accounts || accounts.length === 0) {
        setError("No accounts found in Leap wallet.");
        return;
      }

      setAddress(accounts[0].address);

    
      const rpcUrl = "https://testnet-rpc.zigchain.com";
      const signingClient = await SigningStargateClient.connectWithSigner(rpcUrl, offlineSigner);
      setClient(signingClient);
      setWalletConnected(true);
      setError('');
    } catch (err) {
      setError("Error connecting wallet: " + err.message);
    }
  };

 
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setCsvData(results.data);
        },
        error: (err) => {
          setError("CSV parsing error: " + err.message);
        }
      });
    }
  };


  const handleMultiSend = async () => {
    try {
      if (!client || !walletConnected) {
        setError("Wallet not connected");
        return;
      }
      setError('');

    
      const recipients = csvData
        .filter((row) => row.address && row.amount)
        .map((row) => ({
          address: row.address.trim(),
          amount: row.amount.trim(),
        }));

   
      const totalAmount = recipients.reduce((sum, r) => sum + Number(r.amount), 0);

      const msgMultiSend = {
        typeUrl: "/cosmos.bank.v1beta1.MsgMultiSend",
        value: {
          inputs: [
            {
              address: address,
              coins: [
                {
                  denom: "uzig",
                  amount: totalAmount.toString(),
                },
              ],
            },
          ],
          outputs: recipients.map((r) => ({
            address: r.address,
            coins: [
              {
                denom: "uzig",
                amount: r.amount,
              },
            ],
          })),
        },
      };

      const fee = {
        amount: [
          {
            denom: "uzig",
            amount: feeAmount,
          },
        ],
        gas: gasFee,
      };

      const result = await client.signAndBroadcast(address, [msgMultiSend], fee, "MultiSend transaction");
      setTransactionHash(result.transactionHash);
    } catch (err) {
      setError("Error during multisend transaction: " + err.message);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
 
      <header className="bg-linear-to-t from-sky-500 to-indigo-500 py-4 px-8">
        <h1 className="text-2xl font-bold text-center">Zig Multisender</h1>
      </header>

      <main className="container mx-auto max-w-2xl p-6">

        {error && (
          <div className="bg-red-500 text-white p-3 mb-4 rounded">
            {error}
          </div>
        )}


        {!walletConnected ? (
          <button
            onClick={connectWallet}
            className="bg-linear-to-t from-sky-500 to-indigo-500 text-white font-semibold py-2 px-4 rounded mb-4"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="mb-4">
            <p className="bg-green-700 inline-block py-1 px-2 rounded">
              Wallet Connected: {address}
            </p>
          </div>
        )}


        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Gas Fee (Gas Limit): {gasFee}
          </label>
          <input
            type="range"
            min="100000"
            max="500000"
            step="10000"
            value={gasFee}
            onChange={(e) => setGasFee(e.target.value)}
            className="w-full"
          />
        </div>


        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Transaction Fee Amount (uzig): {feeAmount}
          </label>
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            className="w-full"
          />
        </div>


        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Upload CSV (Headers: address, amount)
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="text-white p-1"
          />
        </div>

       
        {csvData.length > 0 && (
          <div className="bg-gray-800 rounded p-4 mb-4 overflow-x-auto">
            <h2 className="text-lg font-bold mb-2">CSV Preview</h2>
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="bg-gray-700">
                  <th className="py-2 px-2 border-b border-gray-600 text-left">Address</th>
                  <th className="py-2 px-2 border-b border-gray-600 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, index) => (
                  <tr key={index}>
                    <td className="py-2 px-2 border-b border-gray-700">{row.address}</td>
                    <td className="py-2 px-2 border-b border-gray-700">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

    
        <button
          onClick={handleMultiSend}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Send Multisend Transaction
        </button>

       
        {transactionHash && (
          <div className="bg-blue-800 text-white p-3 mt-4 rounded">
            Transaction successful with hash: {transactionHash}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
