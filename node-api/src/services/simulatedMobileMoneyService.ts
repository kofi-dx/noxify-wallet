// src/services/simulatedMobileMoneyService.ts - CREATE THIS FILE
export class SimulatedMobileMoneyService {
  
  // Simulate MoMo payment without real API calls
  async initiateSimulatedPayment(phoneNumber: string, amount: number, paymentId: string) {
    console.log(`📱 SIMULATED MoMo Payment: ${phoneNumber} - GHS ${amount} - ${paymentId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return simulated response
    return {
      success: true,
      transactionId: `sim_momo_${Date.now()}`,
      status: 'pending',
      message: 'Payment initiated - check your phone for simulated prompt',
      instructions: 'SIMULATION: Imagine you received a MoMo prompt on your phone'
    };
  }

  // Simulate payment completion (for testing)
  async completeSimulatedPayment(transactionId: string) {
    console.log(`✅ SIMULATED MoMo Completion: ${transactionId}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      status: 'completed',
      message: 'Payment completed successfully',
      completedAt: new Date().toISOString()
    };
  }

  // Simulate payment failure (for testing)
  async failSimulatedPayment(transactionId: string) {
    console.log(`❌ SIMULATED MoMo Failure: ${transactionId}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: false,
      status: 'failed',
      message: 'Payment failed - insufficient funds',
      failedAt: new Date().toISOString()
    };
  }

  // Convert crypto to GHS for simulation
  convertCryptoToGHS(cryptoAmount: number, cryptoCurrency: string): number {
    // Simulated exchange rates
    const rates = {
      'ETH': 18000, // 1 ETH = 18,000 GHS (simulated)
      'USDC': 12,   // 1 USDC = 12 GHS (simulated)
      'BTC': 350000 // 1 BTC = 350,000 GHS (simulated)
    };
    
    const rate = rates[cryptoCurrency as keyof typeof rates] || 1;
    return cryptoAmount * rate;
  }
}