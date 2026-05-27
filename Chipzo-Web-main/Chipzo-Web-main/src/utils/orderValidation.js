const BANGALORE_CITIES = [
  'bangalore', 'bengaluru', 'bengalooru',
  'bangalore urban', 'bangalore rural',
  'bengaluru urban', 'bengaluru rural',
  'bbmp', 'bda',
  'koramangala', 'whitefield', 'indiranagar', 'jayanagar',
  'malleswaram', 'rajajinagar', 'basavanagudi', 'sadashivanagar',
  'vijayanagar', 'yelahanka', 'hebbal', 'banashankari',
  'marathahalli', 'electronic city', 'ecity', 'jalahalli',
  'peenya', 'kengeri', 'kr puram', 'k.r. puram',
  'yeshwanthpur', 'yeswanthpur', 'dasarahalli', 'nagarbhavi',
  'rr nagar', 'rajarajeshwari', 'jp nagar', 'j p nagar',
  'btm layout', 'hsr layout', 'hsr', 'sarjapur',
  'bellandur', 'kannur', 'anekal', 'devanahalli',
  'attibele', 'jigani', 'bommanahalli', 'madivala',
  'mathikere', 'vidyaranyapura', 'sahakaranagar',
  'nandini layout', 'kumaraswamy layout', 'nagasandra',
  'chickpet', 'gandhinagar', 'shivajinagar',
  'fraser town', 'austin town', 'richmond town',
  'hal', 'vimanasura', 'domlur', 'ulsoor',
  'cmh road', 'mg road', 'brigade road', 'commercial street',
]

const BANGALORE_PINCODES = [
  '560001', '560002', '560003', '560004', '560005', '560006', '560007', '560008',
  '560009', '560010', '560011', '560012', '560013', '560014', '560015', '560016',
  '560017', '560018', '560019', '560020', '560021', '560022', '560023', '560024',
  '560025', '560026', '560027', '560028', '560029', '560030', '560031', '560032',
  '560033', '560034', '560035', '560036', '560037', '560038', '560039', '560040',
  '560041', '560042', '560043', '560044', '560045', '560046', '560047', '560048',
  '560049', '560050', '560051', '560052', '560053', '560054', '560055', '560056',
  '560057', '560058', '560059', '560060', '560061', '560062', '560063', '560064',
  '560065', '560066', '560067', '560068', '560069', '560070', '560071', '560072',
  '560073', '560074', '560075', '560076', '560077', '560078', '560079', '560080',
  '560081', '560082', '560083', '560084', '560085', '560086', '560087', '560088',
  '560089', '560090', '560091', '560092', '560093', '560094', '560095', '560096',
  '560097', '560098', '560099', '560100', '560101', '560102', '560103', '560104',
  '560105', '560106', '560107', '560108', '560109', '560110',
  '562106', '562107', '562110',
]

export function checkSunday() {
  const now = new Date()
  const day = now.getDay()
  return {
    blocked: day === 0,
    message: 'Orders are not available on Sundays. Please place your order from Monday to Saturday.',
  }
}

export function checkTime() {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const totalMinutes = hours * 60 + minutes
  const start = 10 * 60
  const end = 19 * 60 + 30
  return {
    blocked: totalMinutes < start || totalMinutes >= end,
    message: 'Orders can only be placed between 10:00 AM and 7:30 PM.',
  }
}

export function checkBangalore(city, pincode) {
  const cityStr = (city || '').toLowerCase().trim()
  const pincodeStr = (pincode || '').toString().trim()

  const cityMatch = BANGALORE_CITIES.some(c => cityStr.includes(c))
  const pincodeMatch = BANGALORE_PINCODES.includes(pincodeStr)

  const blocked = !cityMatch || !pincodeMatch
  return {
    blocked,
    message: 'Currently, we accept orders only within Bangalore city.',
    details: { cityMatch, pincodeMatch },
  }
}

export function validateOrder(address) {
  const sunday = checkSunday()
  if (sunday.blocked) return sunday

  const time = checkTime()
  if (time.blocked) return time

  if (address) {
    const bangalore = checkBangalore(address.city, address.pincode)
    if (bangalore.blocked) return bangalore
  }

  return { blocked: false, message: '' }
}

export function getOrderStatus() {
  const now = new Date()
  const day = now.getDay()
  if (day === 0) return { label: 'Sunday Holiday', type: 'error', icon: 'Ban' }

  const hours = now.getHours()
  const minutes = now.getMinutes()
  const totalMinutes = hours * 60 + minutes
  const start = 10 * 60
  const end = 19 * 60 + 30

  if (totalMinutes >= start && totalMinutes < end) {
    return { label: 'Accepting Orders Now', type: 'success', icon: 'CheckCircle' }
  }

  return { label: 'Orders Closed', type: 'warning', icon: 'Clock' }
}
