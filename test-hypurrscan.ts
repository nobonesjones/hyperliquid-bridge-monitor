import axios from 'axios'

const TEST_ADDRESS = '0xd5f5c60d6c45f0b56085c3c3a7002936ce73f428' // example address

async function testHypurrscan() {
  const baseURL = 'https://api.hypurrscan.io/v1'
  
  try {
    // First try to add the address to track
    const addResponse = await axios.post(`${baseURL}/add_address`, {
      address: TEST_ADDRESS
    })
    console.log('Add address response:', addResponse.data)

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Then fetch PnL data
    const pnlResponse = await axios.get(`${baseURL}/address/${TEST_ADDRESS}/pnl`)
    console.log('PnL response:', pnlResponse.data)

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message)
    } else {
      console.error('Error:', error)
    }
  }
}

testHypurrscan()
