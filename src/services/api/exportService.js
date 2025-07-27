export const exportService = {
  async exportToPDF(charterData) {
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create HTML content for the charter
    const htmlContent = this.generateCharterHTML(charterData)
    
    // Create a blob and download
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${charterData.profile?.businessName || "Family Business"}_Charter.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  async exportToWord(charterData) {
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create Word-compatible HTML content
    const htmlContent = this.generateWordHTML(charterData)
    
    // Create a blob and download as .doc
    const blob = new Blob([htmlContent], { 
      type: "application/msword" 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${charterData.profile?.businessName || "Family Business"}_Charter.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  generateCharterHTML(charterData) {
    const { profile, responses, pillars } = charterData
    const businessName = profile?.businessName || "Family Business"
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric"
    })

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${businessName} - Family Business Charter</title>
    <style>
        body { 
            font-family: 'Georgia', serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #2c3e50; 
            padding-bottom: 30px; 
            margin-bottom: 40px; 
        }
        .header h1 { 
            color: #2c3e50; 
            font-size: 2.5em; 
            margin-bottom: 10px; 
        }
        .header h2 { 
            color: #8b7355; 
            font-size: 1.5em; 
            font-weight: normal; 
        }
        .business-info { 
            background: #f7f9fc; 
            padding: 25px; 
            border-radius: 8px; 
            margin-bottom: 40px; 
        }
        .business-info h3 { 
            color: #2c3e50; 
            margin-top: 0; 
        }
        .pillar { 
            margin-bottom: 50px; 
            page-break-inside: avoid; 
        }
        .pillar-header { 
            background: linear-gradient(135deg, #2c3e50, #8b7355); 
            color: white; 
            padding: 20px; 
            border-radius: 8px 8px 0 0; 
        }
        .pillar-content { 
            border: 1px solid #ddd; 
            border-top: none; 
            padding: 25px; 
            border-radius: 0 0 8px 8px; 
        }
        .question { 
            margin-bottom: 35px; 
        }
        .question-number { 
            color: #e67e22; 
            font-weight: bold; 
        }
        .question-text { 
            font-weight: bold; 
            color: #2c3e50; 
            margin-bottom: 15px; 
        }
        .response { 
            background: #fafafa; 
            padding: 20px; 
            border-left: 4px solid #e67e22; 
            margin-left: 20px; 
        }
        .footer { 
            text-align: center; 
            margin-top: 60px; 
            padding-top: 30px; 
            border-top: 1px solid #ddd; 
            color: #666; 
        }
    </style>
</head>
<body>
    <div class="Header">
        <h1>Family Business Charter</h1>
        <h2>${businessName}</h2>
        <p>Generated on ${currentDate}</p>
    </div>

    ${profile ? `
    <div class="business-info">
        <h3>Business Information</h3>
        <p><strong>Business Name:</strong> ${profile.businessName}</p>
        <p><strong>Owner:</strong> ${profile.fullName} (${profile.position})</p>
        <p><strong>Business Type:</strong> ${profile.businessType}</p>
        <p><strong>Years in Operation:</strong> ${profile.yearsInBusiness} years</p>
        <p><strong>Location:</strong> ${profile.city}, ${profile.country}</p>
        ${profile.otherOwners ? `<p><strong>Other Owners:</strong> ${profile.otherOwners}</p>` : ""}
    </div>
    ` : ""}

    ${pillars.map(pillar => {
      const pillarResponses = responses[pillar.id] || {}
      return `
        <div class="pillar">
            <div class="pillar-header">
                <h2>${pillar.title}</h2>
                <p>${pillar.subtitle}</p>
            </div>
            <div class="pillar-content">
                <p><em>${pillar.description}</em></p>
                ${pillar.questions.map((question, index) => {
                  const questionId = `q${index + 1}`
                  const response = pillarResponses[questionId]
                  return `
                    <div class="question">
                        <div class="question-number">Question ${index + 1}:</div>
                        <div class="question-text">${question}</div>
                        <div class="response">
                            ${response || "<em>No response provided yet.</em>"}
                        </div>
                    </div>
                  `
                }).join("")}
            </div>
        </div>
      `
    }).join("")}

    <div class="footer">
        <p>This Family Business Charter was generated using Charter Forge</p>
        <p>A tool for family business owners to reflect on and document their business vision</p>
    </div>
</body>
</html>
    `
  },

  generateWordHTML(charterData) {
    // Generate Word-compatible HTML with proper formatting
    return `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <title>${charterData.profile?.businessName || "Family Business"} Charter</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowInsertionsAndDeletions/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5; }
        h1 { font-size: 18pt; color: #2c3e50; text-align: center; }
        h2 { font-size: 14pt; color: #8b7355; }
        h3 { font-size: 12pt; color: #2c3e50; }
        .business-info { background-color: #f7f9fc; padding: 15pt; margin-bottom: 20pt; }
        .pillar { margin-bottom: 30pt; page-break-inside: avoid; }
        .question { margin-bottom: 20pt; }
        .response { background-color: #fafafa; padding: 10pt; border-left: 3pt solid #e67e22; margin-left: 15pt; }
    </style>
</head>
<body>
    ${this.generateCharterHTML(charterData).replace(/<style>[\s\S]*?<\/style>/, "").replace(/<div class="Header">/, "<div>").replace(/class="[^"]*"/g, "")}
</body>
</html>
    `
  }
}