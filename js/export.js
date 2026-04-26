/* ========================================
   Oblique Map Strategies - Export Module
   export.js - Handles PDF, Markdown, and JSON export functionality
   ======================================== */

// ========================================
// Export Configuration
// ========================================
const EXPORT_CONFIG = {
    // PDF settings
    pdf: {
        format: 'letter',
        orientation: 'portrait',
        unit: 'pt',
        compress: true
    },
    
    // Default filename prefix
    filenamePrefix: 'oblique-map-analysis',
    
    // Branding
    appName: 'Oblique Map Strategies',
    appUrl: 'https://github.com/davidrumseymapcenter/oblique-map-strategies'
};

// ========================================
// PDF Export
// Requires jsPDF library
// ========================================

/**
 * Generate and download PDF export
 * @param {Object} appState - Current application state
 * @param {Object} options - Export options (what to include)
 */
async function generatePDF(appState, options) {
    try {
        // Check if jsPDF is available
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF library not loaded');
            showErrorMessage('PDF export requires jsPDF library');
            return;
        }
        
        showSuccessMessage('Generating PDF...');
        
        // Create new PDF document
        const { jsPDF } = jspdf;
        const doc = new jsPDF({
            orientation: EXPORT_CONFIG.pdf.orientation,
            unit: EXPORT_CONFIG.pdf.unit,
            format: EXPORT_CONFIG.pdf.format,
            compress: EXPORT_CONFIG.pdf.compress
        });
        
        let yPosition = 40; // Current vertical position
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - (margin * 2);
        
        // Add header/branding
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text(EXPORT_CONFIG.appName, margin, yPosition);
        yPosition += 30;
        
        // Add current date
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const dateStr = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(dateStr, margin, yPosition);
        yPosition += 30;
        
        // Add metadata if requested
        if (options.includeMetadata && appState.currentMap) {
            yPosition = addMetadataToPDF(doc, appState.currentMap, margin, yPosition, contentWidth);
            yPosition += 20;
        }
        
        // Add prompt if requested
        if (options.includePrompt && appState.currentPrompt) {
            yPosition = addPromptToPDF(doc, appState.currentPrompt, margin, yPosition, contentWidth, pageHeight);
            yPosition += 20;
        }
        
        // Add image views if requested
        if (options.includeImageView || options.includeGeoView) {
            yPosition = await addImagesToPDF(doc, options, margin, yPosition, contentWidth, pageHeight, pageWidth);
        }
        
        // Add analysis text if requested
        if (options.includeAnalysis && options.analysisText) {
            yPosition = addAnalysisToPDF(doc, options.analysisText, margin, yPosition, contentWidth, pageHeight);
        }
        
        // Add footer
        addFooterToPDF(doc, pageWidth, pageHeight);
        
        // Generate filename
        const filename = generateFilename('pdf', appState);
        
        // Save PDF
        doc.save(filename);
        
        showSuccessMessage('PDF downloaded successfully!');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showErrorMessage('Failed to generate PDF. Please try again.');
    }
}

/**
 * Add map metadata section to PDF
 */
function addMetadataToPDF(doc, mapData, x, y, width) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Map Information', x, y);
    y += 20;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const metadata = [
        ['Title:', mapData.title || 'Unknown'],
        ['Date:', mapData.date || 'Unknown'],
        ['Creator:', mapData.creator || 'Unknown'],
        ['Institution:', mapData.institution || 'Unknown'],
        ['Source:', mapData.sourceUrl || 'Not available']
    ];
    
    metadata.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, x, y);
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(value, width - 80);
        doc.text(lines, x + 80, y);
        y += (lines.length * 12) + 5;
    });
    
    return y;
}

/**
 * Add prompt section to PDF
 */
function addPromptToPDF(doc, promptText, x, y, width, pageHeight) {
    // Check if we need a new page
    if (y > pageHeight - 100) {
        doc.addPage();
        y = 40;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Prompt', x, y);
    y += 20;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    const promptLines = doc.splitTextToSize(promptText, width);
    doc.text(promptLines, x, y);
    y += (promptLines.length * 15);
    
    return y;
}

/**
 * Add map images to PDF
 */
async function addImagesToPDF(doc, options, x, y, width, pageHeight, pageWidth) {
    try {
        // Add new page for images
        doc.addPage();
        y = 40;
        
        if (options.includeImageView) {
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Image Analysis View', x, y);
            y += 15;
            
            const imageData = await captureImageViewerScreenshot();
            if (imageData) {
                const imgWidth = width;
                const imgHeight = (width * 3) / 4; // 4:3 aspect ratio
                doc.addImage(imageData, 'PNG', x, y, imgWidth, imgHeight);
                y += imgHeight + 20;
            }
        }
        
        if (options.includeGeoView) {
            // Check if we need a new page
            if (y > pageHeight - 300) {
                doc.addPage();
                y = 40;
            }
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Geographic Context View', x, y);
            y += 15;
            
            const geoData = await captureGeoViewerScreenshot();
            if (geoData) {
                const imgWidth = width;
                const imgHeight = (width * 3) / 4;
                doc.addImage(geoData, 'PNG', x, y, imgWidth, imgHeight);
                y += imgHeight + 20;
            } else {
                doc.setFontSize(10);
                doc.setFont(undefined, 'italic');
                doc.text('Geographic view screenshot not available', x, y);
                y += 20;
            }
        }
        
        return y;
        
    } catch (error) {
        console.error('Error adding images to PDF:', error);
        return y;
    }
}

/**
 * Add analysis text to PDF
 */
function addAnalysisToPDF(doc, analysisText, x, y, width, pageHeight) {
    // Add new page for analysis
    doc.addPage();
    y = 40;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Your Analysis', x, y);
    y += 20;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const lines = doc.splitTextToSize(analysisText, width);
    
    lines.forEach(line => {
        if (y > pageHeight - 60) {
            doc.addPage();
            y = 40;
        }
        doc.text(line, x, y);
        y += 15;
    });
    
    return y;
}

/**
 * Add footer to all pages
 */
function addFooterToPDF(doc, pageWidth, pageHeight) {
    const pageCount = doc.internal.getNumberOfPages();
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128);
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Generated by ${EXPORT_CONFIG.appName} | ${EXPORT_CONFIG.appUrl}`,
            pageWidth / 2,
            pageHeight - 20,
            { align: 'center' }
        );
    }
}

// ========================================
// Markdown Export
// ========================================

/**
 * Generate and download Markdown export
 * @param {Object} appState - Current application state
 * @param {Object} options - Export options
 */
function generateMarkdown(appState, options) {
    try {
        let markdown = '';
        
        // Header
        markdown += `# ${EXPORT_CONFIG.appName}\n\n`;
        markdown += `**Date:** ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}\n\n`;
        
        markdown += '---\n\n';
        
        // Metadata
        if (options.includeMetadata && appState.currentMap) {
            markdown += '## Map Information\n\n';
            markdown += `- **Title:** ${appState.currentMap.title || 'Unknown'}\n`;
            markdown += `- **Date:** ${appState.currentMap.date || 'Unknown'}\n`;
            markdown += `- **Creator:** ${appState.currentMap.creator || 'Unknown'}\n`;
            markdown += `- **Institution:** ${appState.currentMap.institution || 'Unknown'}\n`;
            if (appState.currentMap.sourceUrl) {
                markdown += `- **Source:** [View Original](${appState.currentMap.sourceUrl})\n`;
            }
            markdown += '\n';
        }
        
        // Prompt
        if (options.includePrompt && appState.currentPrompt) {
            markdown += '## Prompt\n\n';
            markdown += `> ${appState.currentPrompt}\n\n`;
        }
        
        // Analysis
        if (options.includeAnalysis && options.analysisText) {
            markdown += '## Your Analysis\n\n';
            markdown += `${options.analysisText}\n\n`;
        }
        
        // Footer
        markdown += '---\n\n';
        markdown += `*Generated by [${EXPORT_CONFIG.appName}](${EXPORT_CONFIG.appUrl})*\n`;
        
        // Download
        const filename = generateFilename('md', appState);
        downloadTextFile(markdown, filename, 'text/markdown');
        
        showSuccessMessage('Markdown file downloaded!');
        
    } catch (error) {
        console.error('Error generating Markdown:', error);
        showErrorMessage('Failed to generate Markdown. Please try again.');
    }
}

// ========================================
// JSON Export
// ========================================

/**
 * Generate and download JSON export
 * @param {Object} appState - Current application state
 * @param {Object} options - Export options
 */
function generateJSON(appState, options) {
    try {
        const exportData = {
            metadata: {
                appName: EXPORT_CONFIG.appName,
                appUrl: EXPORT_CONFIG.appUrl,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            },
            map: options.includeMetadata && appState.currentMap ? {
                id: appState.currentMap.id,
                title: appState.currentMap.title,
                date: appState.currentMap.date,
                creator: appState.currentMap.creator,
                institution: appState.currentMap.institution,
                sourceUrl: appState.currentMap.sourceUrl,
                manifestUrl: appState.currentMap.manifestUrl
            } : null,
            prompt: options.includePrompt ? appState.currentPrompt : null,
            analysis: options.includeAnalysis ? options.analysisText : null
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const filename = generateFilename('json', appState);
        downloadTextFile(jsonString, filename, 'application/json');
        
        showSuccessMessage('JSON file downloaded!');
        
    } catch (error) {
        console.error('Error generating JSON:', error);
        showErrorMessage('Failed to generate JSON. Please try again.');
    }
}

// ========================================
// Utility Functions
// ========================================

/**
 * Generate filename for export
 * @param {string} extension - File extension
 * @param {Object} appState - Current app state
 * @returns {string} Generated filename
 */
function generateFilename(extension, appState) {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const mapTitle = appState.currentMap?.title || 'map';
    const sanitizedTitle = mapTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 30);
    
    return `${EXPORT_CONFIG.filenamePrefix}-${sanitizedTitle}-${timestamp}.${extension}`;
}

/**
 * Download text file
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
function downloadTextFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Copy content to clipboard
 * @param {string} content - Content to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(content) {
    try {
        await navigator.clipboard.writeText(content);
        showSuccessMessage('Copied to clipboard!');
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showErrorMessage('Failed to copy to clipboard');
        return false;
    }
}