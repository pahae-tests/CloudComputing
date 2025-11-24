export default async function handler(req, res) {
  try {
    const response = await fetch('http://4.211.255.87/people_daily_remote.csv');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    res.status(200).json({
      success: true,
      data: text
    });
  } catch (error) {
    console.error('Error fetching CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}