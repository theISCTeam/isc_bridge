//import '@picocss/pico'
// index.html
import styles from '../styles/mystyle.module.css'
import { Inter } from 'next/font/google'
import myApplication from '../scripts/my-application.mjs'

const inter = Inter({ subsets: ['latin'] })

import { useEffect, useState } from 'react';
function Header({ title }) {
  return <h1>{title ? title : 'Default title'}</h1>;
}

function Tick() {
    return <span className={styles.icon}>
          <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0h24v24H0z" fill="none"></path>
          <path fill="currentColor" d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
          </svg>
          </span>
}

function ListEntry({value}) {
    return <li> <Tick/> <span>{value}</span> </li>
}

function CardTitle({value}) {
    return <p className={styles.title}>{value}</p>
}

function CardParagraph({value}) {
    return <p className={styles.info}>{value}</p>
}

function CardData({value}) {
    return <p className={styles.data}>{value}</p>
}

function CardButton({value, enable, click_handler}) {
    return <div className={styles.action}>
            <a className={enable?styles.button:styles.button_disabled} onClick={click_handler} href="#"> {value} </a>
           </div>
}

function MyTable({value}) {
    return (
        <div className={inter.className}>
                <table className={styles.card}>
                    <thead>
                    <tr>
                        <th>Item</th>
                        <th>Solana</th>
                        <th>Ethereum</th>
                    </tr>
                    </thead>
                    <tbody>
                        {value.map((val, key) => {
                            return (
                            <tr key={key}>
                            <td>{val.item}</td>
                            <td>{val.solana}</td>
                            <td>{val.ethereum}</td>
                            </tr>
                            )
                        })}
                    </tbody>
                </table>
        </div>
    );
}

function Loading() {
    return <div className={styles.ldsellipsis}><div></div><div></div><div></div><div></div></div>
}

function Card({step, card_topic, data, loading, enable, click_handler}) {
  let info
  if (step == "2" && data!=null) {
      info = data.vaaBytes
  } else if (step == "1" && data !=null && typeof(data)!='string') {
      info = data.transactionHash
  } else {
      info = data
  }
  //const info = step == "2" && data!=null ? data.vaaBytes : data
  return <div className={inter.className}>
          <div className={styles.plan}>
              <div className={styles.inner}>
              <CardTitle value={card_topic.title}/>
              <CardParagraph value={card_topic.content}/>
              {loading && <Loading/>}
              <CardData value={info}/>
              <CardButton value="Initiate" enable={enable} click_handler={click_handler}/>
              </div>
          </div>
      </div>
}

function Form({event_handler, setDirection, enabled}) {
    function inputHandler(event) {
        if (event.target.id == 'amount') {
            event_handler(event.target.value)
        } else {
            console.log(event.target.id)
            setDirection(event.target.id)
        }
    }

    return (
        <div className={inter.className}>
        <div className={styles.table_container}>
        <div className={styles.inner}>
            <form className = {styles.form}> 
                <input type="radio" id="sol_to_eth" name="swap_direction" value="Swap from Solana to Ethereum" onChange={inputHandler} disabled={!enabled}/>
                <label><strong>Swap from Solana to Ethereum</strong></label><br/>
                <input type="radio" id="eth_to_sol" name="swap_direction" value="Swap from Ethereum to Solana" onChange={inputHandler} disabled={!enabled}/>
                <label><strong>Swap from Ethereum to Solana</strong></label><br/>
                <label><strong>Swap Amount </strong></label>
                <input type="text" id="amount" name="Swap Amount" disabled={!enabled} onChange={inputHandler}/><br/>
            </form>
        </div>
        </div>
        </div>
    )
}

function EthereumToSolanaApp({amount, curr_step, setBalance, setCurrStep, my_application}) {
    const [step0, setStep0] = useState(null);
    const [step1, setStep1] = useState(null);
    const [step2, setStep2] = useState(null);
    const [step3, setStep3] = useState(null);
    const [step4, setStep4] = useState(null);

    async function updateBalance() {
        const solana_bal = await my_application.solana_swap.fetch_balance()
        const eth_bal = await my_application.ethereum_swap.fetch_balance()
        console.log(solana_bal)
        console.log(eth_bal)
        const result = []
        result.push({'item':'User ISC', 'solana':solana_bal.user_isc, 'ethereum':eth_bal.user_isc})
        result.push({'item':'User OIL', 'solana':solana_bal.user_oil, 'ethereum':eth_bal.user_oil})
        result.push({'item':'Pool ISC', 'solana':solana_bal.pool_isc, 'ethereum':eth_bal.pool_isc})
        result.push({'item':'Pool OIL', 'solana':solana_bal.pool_oil, 'ethereum':eth_bal.pool_oil})
        result.push({'item':'User SOL', 'solana':solana_bal.user_sol, 'ethereum':0})
        setBalance(result)
    }

    useEffect(() => {
        const fetchData = async () => {
            await updateBalance();
        }
        fetchData()
    }, [])

    async function handleStep0() {
        if (curr_step != null) {
            return
        }
        setCurrStep("step_0_busy")
        const txid = await my_application.ethereum_swap.swap_isc_to_oil(amount)
        setStep0(txid)
        console.log(txid)
        updateBalance()
        setCurrStep("step0")
    }
    async function handleStep1() {
        if (curr_step != "step0") {
            return
        }
        setCurrStep("step_1_busy")
        const txid = await my_application.wormhole.send_from_ethereum(amount)
        setStep1(txid)
        updateBalance()
        setCurrStep("step1")
    }
    async function handleStep2() {
        if (curr_step != "step1") {
            return
        }
        setCurrStep("step_2_busy")
        const vaa = await my_application.wormhole.get_vaa_bytes_ethereum(step1)
        setStep2(vaa)
        updateBalance()
        setCurrStep("step2")
    }
    async function handleStep3() {
        if (curr_step != "step2") {
            return
        }
        setCurrStep("step_3_busy")
        const tx = await my_application.wormhole.complete_transfer_on_solana(step2)
        setStep3(tx)
        updateBalance()
        setCurrStep("step3")
    }
    async function handleStep4() {
        if (curr_step != "step3") {
            return
        }
        setCurrStep("step_4_busy")
        const txid = await my_application.solana_swap.swap_oil_to_isc(amount)
        setStep4(txid)
        updateBalance()
        setCurrStep(null)
    }

    const card_topics = [
        {
            'title': 'Swap '+amount+' ISC to xOIL',
            'content': 'This step interacts with the swap contract on Solana to swap your ISC to OIL'
        },
        {
            'title': 'Send xOIL to Wormhole',
            'content': 'Send the swapped OIL to Wormhole smart contract and request for a VAA'
        },
        {
            'title': 'Get VAA Bytes',
            'content': 'Check the Wormhole network for the verified message of solana transaction'
        },
        {
            'title': 'Get OIL on Solana',
            'content': 'Interact with the Wormhole smart contract on Ethereum to receive the xOIL in your wallet'
        },
        {
            'title': 'Swap '+amount+' OIL to ISC',
            'content': 'Interact with the swap contract on Ethereum to receive native ISC'
        },
    ];

  return <div>
            <Card step={0} card_topic={card_topics[0]} data={step0} loading={curr_step=="step_0_busy"} enable={curr_step==null} click_handler={handleStep0}/>
            <Card step={1} card_topic={card_topics[1]} data={step1} loading={curr_step=="step_1_busy"} enable={curr_step=="step0"} click_handler={handleStep1}/>
            <Card step={2} card_topic={card_topics[2]} data={step2} loading={curr_step=="step_2_busy"} enable={curr_step=="step1"} click_handler={handleStep2}/>
            <Card step={3} card_topic={card_topics[3]} data={step3} loading={curr_step=="step_3_busy"} enable={curr_step=="step2"} click_handler={handleStep3}/>
            <Card step={4} card_topic={card_topics[4]} data={step4} loading={curr_step=="step_4_busy"} enable={curr_step=="step3"} click_handler={handleStep4}/>
        </div>
}

function SolanaToEthereumApp({amount, curr_step, setBalance, setCurrStep, my_application}) {
    const [step0, setStep0] = useState(null);
    const [step1, setStep1] = useState(null);
    const [step2, setStep2] = useState(null);
    const [step3, setStep3] = useState(null);
    const [step4, setStep4] = useState(null);

    async function updateBalance() {
        const solana_bal = await my_application.solana_swap.fetch_balance()
        const eth_bal = await my_application.ethereum_swap.fetch_balance()
        console.log(solana_bal)
        console.log(eth_bal)
        const result = []
        result.push({'item':'User ISC', 'solana':solana_bal.user_isc, 'ethereum':eth_bal.user_isc})
        result.push({'item':'User OIL', 'solana':solana_bal.user_oil, 'ethereum':eth_bal.user_oil})
        result.push({'item':'Pool ISC', 'solana':solana_bal.pool_isc, 'ethereum':eth_bal.pool_isc})
        result.push({'item':'Pool OIL', 'solana':solana_bal.pool_oil, 'ethereum':eth_bal.pool_oil})
        result.push({'item':'User SOL', 'solana':solana_bal.user_sol, 'ethereum':0})
        setBalance(result)
    }

    useEffect(() => {
        const fetchData = async () => {
            await updateBalance();
        }
        fetchData()
    }, [])

    async function handleStep0() {
        if (curr_step != null) {
            return
        }
        setCurrStep("step_0_busy")
        const txid = await my_application.solana_swap.swap_isc_to_oil(amount)
        setStep0(txid)
        console.log(txid)
        updateBalance()
        setCurrStep("step0")
    }
    async function handleStep1() {
        if (curr_step != "step0") {
            return
        }
        setCurrStep("step_1_busy")
        const txid = await my_application.wormhole.send_from_solana(amount)
        setStep1(txid)
        updateBalance()
        setCurrStep("step1")
    }
    async function handleStep2() {
        if (curr_step != "step1") {
            return
        }
        setCurrStep("step_2_busy")
        const vaa = await my_application.wormhole.get_vaa_bytes_solana(step1)
        setStep2(vaa)
        updateBalance()
        setCurrStep("step2")
    }
    async function handleStep3() {
        if (curr_step != "step2") {
            return
        }
        setCurrStep("step_3_busy")
        const tx = await my_application.wormhole.complete_transfer_on_eth(step2)
        setStep3(tx)
        updateBalance()
        setCurrStep("step3")
    }
    async function handleStep4() {
        if (curr_step != "step3") {
            return
        }
        setCurrStep("step_4_busy")
        const txid = await my_application.ethereum_swap.swap_oil_to_isc(amount)
        setStep4(txid)
        updateBalance()
        setCurrStep(null)
    }

    const card_topics = [
        {
            'title': 'Swap '+amount+' ISC to OIL',
            'content': 'This step interacts with the swap contract on Solana to swap your ISC to OIL'
        },
        {
            'title': 'Send OIL to Wormhole',
            'content': 'Send the swapped OIL to Wormhole smart contract and request for a VAA'
        },
        {
            'title': 'Get VAA Bytes',
            'content': 'Check the Wormhole network for the verified message of solana transaction'
        },
        {
            'title': 'Get xOIL on Ethereum',
            'content': 'Interact with the Wormhole smart contract on Ethereum to receive the xOIL in your wallet'
        },
        {
            'title': 'Swap '+amount+' xOIL to ISC',
            'content': 'Interact with the swap contract on Ethereum to receive native ISC'
        },
    ];

  return <div>
            <Card step={0} card_topic={card_topics[0]} data={step0} loading={curr_step=="step_0_busy"} enable={curr_step==null} click_handler={handleStep0}/>
            <Card step={1} card_topic={card_topics[1]} data={step1} loading={curr_step=="step_1_busy"} enable={curr_step=="step0"} click_handler={handleStep1}/>
            <Card step={2} card_topic={card_topics[2]} data={step2} loading={curr_step=="step_2_busy"} enable={curr_step=="step1"} click_handler={handleStep2}/>
            <Card step={3} card_topic={card_topics[3]} data={step3} loading={curr_step=="step_3_busy"} enable={curr_step=="step2"} click_handler={handleStep3}/>
            <Card step={4} card_topic={card_topics[4]} data={step4} loading={curr_step=="step_4_busy"} enable={curr_step=="step3"} click_handler={handleStep4}/>
        </div>
}

function AppSelector({amount, curr_step, setBalance, setCurrStep, my_application, direction}) {
    if (direction == 'sol_to_eth') {
        return <SolanaToEthereumApp
                amount={amount}
                curr_step={curr_step}
                setBalance={setBalance}
                setCurrStep={setCurrStep}
                my_application={my_application}/>
    } else {
        return <EthereumToSolanaApp
                amount={amount}
                curr_step={curr_step}
                setBalance={setBalance}
                setCurrStep={setCurrStep}
                my_application={my_application}/>
    }
}

export default function HomePage() {
    const my_application = new myApplication();
    const [balance, setBalance] = useState([]);
    const [amount, setAmount] = useState(0.0001);
    const [direction, setDirection] = useState('sol_to_eth');
    const [curr_step, setCurrStep] = useState(null);

    async function updateBalance() {
        const solana_bal = await my_application.solana_swap.fetch_balance()
        const eth_bal = await my_application.ethereum_swap.fetch_balance()
        console.log(solana_bal)
        console.log(eth_bal)
        const result = []
        result.push({'item':'User ISC', 'solana':solana_bal.user_isc, 'ethereum':eth_bal.user_isc})
        result.push({'item':'User OIL', 'solana':solana_bal.user_oil, 'ethereum':eth_bal.user_oil})
        result.push({'item':'Pool ISC', 'solana':solana_bal.pool_isc, 'ethereum':eth_bal.pool_isc})
        result.push({'item':'Pool OIL', 'solana':solana_bal.pool_oil, 'ethereum':eth_bal.pool_oil})
        result.push({'item':'User SOL', 'solana':solana_bal.user_sol, 'ethereum':0})
        setBalance(result)
    }

    async function updateBalanceLoop() {
        while (true) {
            await new Promise(r => setTimeout(r, 2000));
            await updateBalance();
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            await updateBalanceLoop();
        }
        fetchData()
    }, [])


  return <div className={styles.flex}>
        <AppSelector
            amount={amount}
            curr_step={curr_step}
            setBalance={setBalance}
            setCurrStep={setCurrStep}
            my_application={my_application}
            direction={direction}
        />
        <div>
        <Form event_handler={setAmount} setDirection={setDirection} enabled={curr_step==null}/>
        <MyTable value={balance}/>
        </div>
            <style jsx global>{" body { background: #e0e0e0; } "}</style>
        </div>
}


async function swap_fully() {
    const my_application = new myApplication();
    //console.log(my_application.print_balance())
    console.log(my_application.solana_swap.fetch_balance())
    //console.log("STARTING SOL -> ETH")
    const amount = 0.0001
    let txid = await my_application.solana_swap.swap_isc_to_oil(amount)
    //console.log(await wormhole.bridge_from_solana(amount))
    txid = await my_application.wormhole.send_from_solana(amount)
    const vaa = await my_application.wormhole.get_vaa_bytes_solana(txid)
    const tx = await my_application.wormhole.complete_transfer_on_eth(vaa)
    txid = await my_application.ethereum_swap.swap_oil_to_isc(amount)
    console.log("Bridge to Ethereum completed", txid)
}
