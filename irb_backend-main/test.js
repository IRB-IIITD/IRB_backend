const {saveAs} = require('file-saver');
const axios = require('axios');
const window = require('window');

// async function printTickets() {
//   const { data } = await getTicketsPdf();
//   const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
//   saveAs(blob, "tickets.docx");
// }

// async function getTicketsPdf() {
//   return axios.get('http://localhost:8000/irb/getCommentsDoc/6408a6baa983f6d77298fff4', {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     },
//     responseType: 'arraybuffer'
//   })
// }
async function getTicketsDocx() {
    const response = await axios.get('http://localhost:8000/irb/getCommentsDoc/6408a6baa983f6d77298fff4', {
      responseType: 'blob'
    });
    return response.data;
  };
  
  async function printTickets() {
    const docx = await getTicketsDocx();
    const url = window.URL.createObjectURL(new Blob([docx]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tickets.docx');
    document.body.appendChild(link);
    link.click();
  }

printTickets();