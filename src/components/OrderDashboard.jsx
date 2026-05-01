import { useState } from 'react';
import { 
  useLazyCheckCustomerQuery, 
  useLazyGetCustomerOrdersQuery, 
  useCreateOrderMutation, 
  useRecordPaymentMutation,
  useGetAllOrdersQuery
} from '../redux/apiSlice';

const OrderDashboard = () => {
  const [viewMode, setViewMode] = useState('order'); // 'order', 'payment' or 'report'
  const [formData, setFormData] = useState({
    customerName: '',
    projectName: '',
    services: '',
    projectCost: '',
    paidAmount: '',
    paymentMode: 'Cash',
    bankName: '',
    orderDate: new Date().toISOString().split('T')[0]
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMode: 'Cash',
    bankName: '',
    orderDate: new Date().toISOString().split('T')[0]
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchName, setSearchName] = useState('');
  
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);

  // RTK Query Hooks
  const [checkCustomer, { isFetching: isChecking }] = useLazyCheckCustomerQuery();
  const [getOrders, { isFetching: isFetchingOrders }] = useLazyGetCustomerOrdersQuery();
  const [createOrder, { isLoading: isSubmittingOrder }] = useCreateOrderMutation();
  const [recordPayment, { isLoading: isSubmittingPayment }] = useRecordPaymentMutation();
  const { data: reportData, isLoading: isLoadingReport, isError: isReportError } = useGetAllOrdersQuery(undefined, {
    skip: viewMode !== 'report'
  });

  const isSubmitting = isSubmittingOrder || isSubmittingPayment;

  // Calculate balance dynamically for new order
  const cost = Number(formData.projectCost) || 0;
  const paid = Number(formData.paidAmount) || 0;
  const balance = cost - paid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (isFormVisible && viewMode === 'payment') {
      let updatedValue = value;
      if (name === 'amount' && selectedOrder) {
        const numValue = Number(value);
        if (numValue > selectedOrder.balance) {
          updatedValue = selectedOrder.balance.toString();
        }
      }
      setPaymentData(prev => ({ ...prev, [name]: updatedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));    
    }
  };

  const handleCustomerCheck = async () => {
    if (!searchName.trim()) {
      setErrorMessage('Please enter a customer name.');
      return;
    }

    setErrorMessage('');

    try {
      if (viewMode === 'order') {
        const result = await checkCustomer(searchName).unwrap();
        setFormData(prev => ({ ...prev, customerName: result.customer.name }));
        setIsFormVisible(true);
      } else {
        const result = await getOrders(searchName).unwrap();
        if (result.orders.length === 0) {
          setErrorMessage('No pending projects found for this customer.');
        } else {
          setPendingOrders(result.orders);
          setFormData(prev => ({ ...prev, customerName: result.orders[0].customerName }));
          setIsFormVisible(true);
        }
      }
    } catch (err) {
      setErrorMessage(err?.data?.message || 'Error occurred. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      let result;
      if (viewMode === 'order') {
        result = await createOrder(formData).unwrap();
        setLastSavedData({ ...formData, type: 'New Project Order' });
      } else {
        if (!selectedOrder) {
          setErrorMessage('Please select a project to pay for.');
          return;
        }

        const payAmount = Number(paymentData.amount);
        if (payAmount > selectedOrder.balance) {
          setErrorMessage(`Payment amount cannot exceed the remaining balance of ₹${selectedOrder.balance}`);
          return;
        }
        if (payAmount <= 0) {
          setErrorMessage('Please enter a valid payment amount.');
          return;
        }

        result = await recordPayment({ 
          id: selectedOrder._id, 
          customerName: selectedOrder.customerName,
          ...paymentData 
        }).unwrap();
        
        setLastSavedData({
          customerName: selectedOrder.customerName,
          projectName: selectedOrder.projectName,
          amount: paymentData.amount,
          paymentMode: paymentData.paymentMode,
          bankName: paymentData.bankName,
          orderDate: paymentData.orderDate,
          type: 'Payment Collection',
          remainingBalance: selectedOrder.balance - Number(paymentData.amount)
        });
      }

      setShowSuccessModal(true);
    } catch (err) {
      setErrorMessage(err?.data?.message || 'Failed to process request.');
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setIsFormVisible(false);
    setSearchName('');
    setSelectedOrder(null);
    setPendingOrders([]);
    setFormData({
      customerName: '',
      projectName: '',
      services: '',
      projectCost: '',
      paidAmount: '',
      paymentMode: 'Cash',
      bankName: '',
      orderDate: new Date().toISOString().split('T')[0]
    });
    setPaymentData({
      amount: '',
      paymentMode: 'Cash',
      bankName: '',
      orderDate: new Date().toISOString().split('T')[0]
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="order-dashboard-wrapper">
      <div className={`glass-panel ${viewMode === 'report' ? 'wide' : ''}`} style={{ margin: '0 auto' }}>
        <div className="tab-container">
          <button 
            className={`tab-btn ${viewMode === 'order' ? 'active' : ''}`}
            onClick={() => { setViewMode('order'); setIsFormVisible(false); setErrorMessage(''); }}
          >
            New Order
          </button>
          <button 
            className={`tab-btn ${viewMode === 'payment' ? 'active' : ''}`}
            onClick={() => { setViewMode('payment'); setIsFormVisible(false); setErrorMessage(''); }}
          >
            Receive Payment
          </button>
          <button 
            className={`tab-btn ${viewMode === 'report' ? 'active' : ''}`}
            onClick={() => { setViewMode('report'); setIsFormVisible(false); setErrorMessage(''); }}
          >
            View Report
          </button>
        </div>

        <h1 className="title">
          {viewMode === 'order' ? 'Project Order Form' : 
           viewMode === 'payment' ? 'Payment Collection' : 'Data Report'}
        </h1>
        
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {viewMode === 'report' ? (
          <div className="report-section">
            {isLoadingReport ? (
              <div className="loading-spinner">Loading reports...</div>
            ) : isReportError ? (
              <div className="error-message">Failed to load reports.</div>
            ) : (
              <>
                <div className="report-header-grid">
                  <div className="stat-card">
                    <div className="stat-label">Total Orders</div>
                    <div className="stat-value">{reportData?.orders?.length || 0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total Customers</div>
                    <div className="stat-value">{[...new Set(reportData?.orders?.map(o => o.customerName))].length}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Active Projects</div>
                    <div className="stat-value pending">{reportData?.orders?.filter(o => o.balance > 0).length}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total Collection</div>
                    <div className="stat-value collected">₹{reportData?.orders?.reduce((acc, curr) => acc + curr.paidAmount, 0)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Pending Balance</div>
                    <div className="stat-value pending">₹{reportData?.orders?.reduce((acc, curr) => acc + curr.balance, 0)}</div>
                  </div>
                </div>

                <div className="report-table-container">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Project</th>
                        <th>Services</th>
                        <th>payment Mode</th>
                        <th>Total Cost</th>
                        <th>Paid</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.orders?.length > 0 ? (
                        reportData.orders.map((order) => (
                          <tr key={order._id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(order.orderDate).toLocaleDateString()}</td>
                            <td className="customer-name-cell">{order.customerName}</td>
                            <td className="project-name-cell">{order.projectName}</td>
                            <td className="services-cell" title={order.services}>{order.services}</td>
                            <td><span className={`badge ${order.paymentMode?.toLowerCase()}`}>{order.paymentMode}</span></td>
                            <td>₹{order.projectCost}</td>
                            <td>₹{order.paidAmount}</td>
                            <td className={order.balance > 0 ? 'balance-due' : 'balance-cleared'}>
                              ₹{order.balance}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No orders found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : !isFormVisible ? (
          <div className="search-section">
            <div className="welcome-icon">
              <div className="user-avatar"></div>
            </div>
            <div className="input-group">
              <label>Customer Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search customer..."
              />
            </div>
            <button
              onClick={handleCustomerCheck}
              className={`submit-btn submit-btn-full ${isChecking || isFetchingOrders ? 'loading' : ''}`}
              disabled={isChecking || isFetchingOrders}
            >
              {isChecking || isFetchingOrders ? 'Checking...' : viewMode === 'order' ? 'Continue to Order' : 'Find Pending Projects'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="order-form">
            {viewMode === 'order' ? (
              <>
                <div className="form-row">
                  <div className="input-group">
                    <label>Order Date</label>
                    <input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label>Project Name</label>
                    <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} required placeholder="e.g. Website" />
                  </div>
                </div>

                <div className="input-group">
                  <label>Customer Name</label>
                  <input type="text" value={formData.customerName} readOnly className="readonly-input" />
                </div>

                <div className="input-group">
                  <label>Services</label>
                  <textarea name="services" value={formData.services} onChange={handleChange} required rows="2" placeholder="Describe services..." />
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Project Cost (₹)</label>
                    <input type="number" name="projectCost" value={formData.projectCost} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label>Paid Amount (₹)</label>
                    <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Balance</label>
                    <input type="text" value={`₹ ${balance}`} readOnly className="readonly-input" />
                  </div>
                  <div className="input-group">
                    <label>Payment Mode</label>
                    <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label>Select Project to Pay</label>
                  <div className="order-list">
                    {pendingOrders.map(order => (
                      <div 
                        key={order._id} 
                        className={`order-item ${selectedOrder?._id === order._id ? 'selected' : ''}`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="order-info">
                          <span className="order-project">{order.projectName}</span>
                          <span className="order-balance">₹{order.balance}</span>
                        </div>
                        <div className="order-date">Date: {new Date(order.orderDate).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder && (
                  <>
                    <div className="form-row">
                      <div className="input-group">
                        <label>Payment Date</label>
                        <input type="date" name="orderDate" value={paymentData.orderDate} onChange={handleChange} required />
                      </div>
                      <div className="input-group">
                        <label>Amount to Pay (₹)</label>
                        <input type="number" name="amount" value={paymentData.amount} onChange={handleChange} required max={selectedOrder.balance} placeholder={`Max ₹${selectedOrder.balance}`} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Payment Mode</label>
                      <select name="paymentMode" value={paymentData.paymentMode} onChange={handleChange}>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            {(viewMode === 'order' || selectedOrder) && (
              <>
                {(viewMode === 'order' ? formData.paymentMode === 'Bank' : paymentData.paymentMode === 'Bank') && (
                  <div className="input-group">
                    <label>Bank Name</label>
                    <select name="bankName" value={viewMode === 'order' ? formData.bankName : paymentData.bankName} onChange={handleChange} required>
                      <option value="" disabled>Select Bank</option>
                      <option value="SBI">SBI</option>
                      <option value="HDFC">HDFC</option>
                      <option value="ICICI">ICICI</option>
                      <option value="Axis">Axis</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setIsFormVisible(false)}>Back</button>
                  <button
                    type="submit"
                    className={`submit-btn submit-btn-full ${isSubmitting ? 'loading' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : viewMode === 'order' ? 'Save Order' : 'Record Payment'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>

      {/* Success Modal / Receipt Redirect */}
      {showSuccessModal && lastSavedData && (
        <div className="success-overlay">
          <div className="success-card" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="success-check" style={{ marginBottom: '10px' }}>✓</div>
            <h2 style={{ marginBottom: '5px' }}>Transaction Successful!</h2>
            <p style={{ marginBottom: '20px' }}>Your receipt is ready below.</p>
            
            <div className="receipt-preview" style={{ 
              background: '#f8fafc', 
              padding: '20px', 
              borderRadius: '16px', 
              textAlign: 'left',
              border: '1px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
                <strong>{lastSavedData.type}</strong>
                <span>{new Date(lastSavedData.orderDate).toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Customer:</span>
                  <strong>{lastSavedData.customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Project:</span>
                  <strong>{lastSavedData.projectName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <strong>{lastSavedData.paymentMode}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', marginTop: '5px' }}>
                  <span>Amount Paid:</span>
                  <strong style={{ color: 'var(--success)', fontSize: '1.2em' }}>₹{lastSavedData.type === 'New Project Order' ? lastSavedData.paidAmount : lastSavedData.amount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Remaining Balance:</span>
                  <strong style={{ color: '#ef4444' }}>₹{lastSavedData.type === 'New Project Order' ? (Number(lastSavedData.projectCost) - Number(lastSavedData.paidAmount)) : lastSavedData.remainingBalance}</strong>
                </div>
              </div>
            </div>

            <div className="receipt-actions">
              <button className="print-btn" onClick={handlePrint}>🖨️ Print Now</button>
              <button className="close-btn" onClick={handleCloseSuccess}>🏠 Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Receipt */}
      {lastSavedData && (
        <div id="printable-receipt">
          <div className="receipt-header">
            <div>
              <div className="receipt-title">INVOICE / RECEIPT</div>
              <p>{lastSavedData.type}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><strong>Date:</strong> {new Date(lastSavedData.orderDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> PAID</p>
            </div>
          </div>

          <div className="receipt-body">
            <div className="receipt-row">
              <span>Customer Name:</span>
              <strong>{lastSavedData.customerName}</strong>
            </div>
            <div className="receipt-row">
              <span>Project Name:</span>
              <strong>{lastSavedData.projectName}</strong>
            </div>
            {lastSavedData.services && (
              <div className="receipt-row">
                <span>Services:</span>
                <strong>{lastSavedData.services}</strong>
              </div>
            )}
            <div className="receipt-row">
              <span>Payment Mode:</span>
              <strong>{lastSavedData.paymentMode} {lastSavedData.bankName ? `(${lastSavedData.bankName})` : ''}</strong>
            </div>
            
            <div className="receipt-row total">
              <span>{lastSavedData.type === 'New Project Order' ? 'Amount Paid:' : 'Payment Received:'}</span>
              <strong>₹{lastSavedData.type === 'New Project Order' ? lastSavedData.paidAmount : lastSavedData.amount}</strong>
            </div>

            {lastSavedData.type === 'New Project Order' ? (
              <div className="receipt-row">
                <span>Total Project Cost:</span>
                <strong>₹{lastSavedData.projectCost}</strong>
              </div>
            ) : null}

            <div className="receipt-row">
              <span>Remaining Balance:</span>
              <strong>₹{lastSavedData.type === 'New Project Order' ? (Number(lastSavedData.projectCost) - Number(lastSavedData.paidAmount)) : lastSavedData.remainingBalance}</strong>
            </div>
          </div>

          <div className="stamp">
            <div className="stamp-box">RECEIVED</div>
          </div>

          <div className="receipt-footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated receipt.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDashboard;
