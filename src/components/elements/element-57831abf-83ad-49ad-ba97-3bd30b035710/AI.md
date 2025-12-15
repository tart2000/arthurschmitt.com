---
name: ww-rich-text
description: The ww-rich-text component renders rich text content with customizable styles for various HTML elements, supports markdown and HTML input, and offers a lightbox effect for images, ensuring versatile and visually appealing text presentation. This is for rendering rich text, not to edit rich text.
keywords: rich text rendering, display markdown, customizable styles, markdown support, multi-language support, formatted innerHTML, formatting text
---

#### ww-rich-text

***Purpose:***
Renders rich text content with customizable styles for various HTML elements such as headings, paragraphs, links, blockquotes, images, and iframes. Supports markdown and HTML input, and provides options to enable a lightbox effect for images.

***Properties:***
- text: { [lang]: string } | string - Content to be rendered as rich text. Default: { en: '' }
- h1: object - Styling options for h1 elements. Default: { fontSize: '32px', fontFamily: '', fontWeight: '', textAlign: '', color: '', lineHeight: '', marginTop: '', marginBottom: '' }
- h2: object - Styling options for h2 elements. Default: { fontSize: '24px', fontFamily: '', fontWeight: '', textAlign: '', color: '', lineHeight: '', marginTop: '', marginBottom: '' }
- h3: object - Styling options for h3 elements. Default: { fontSize: '19px', fontFamily: '', fontWeight: '', textAlign: '', color: '', lineHeight: '', marginTop: '', marginBottom: '' }
- h4: object - Styling options for h4 elements. Default: { fontSize: '16px', fontFamily: '', fontWeight: '', textAlign: '', color: '', lineHeight: '', marginTop: '', marginBottom: '' }
- p: object - Styling options for p elements. Default: { fontSize: '16px', fontFamily: '', fontWeight: '', textAlign: '', color: '', lineHeight: '', marginTop: '', marginBottom: '' }
- a: object - Styling options for a elements. Default: { fontSize: '16px', fontFamily: '', color: '', isUnderline: true }
- blockquote: object - Styling options for blockquote elements. Default: { color: 'rgb(153, 153, 153)', borderColor: 'rgb(223, 226, 229)', marginTop: '6px', marginBottom: '6px' }
- img: object - Styling and behavior options for img elements. Default: { width: '100%', zoomEffect: false, marginTop: '6px', marginBottom: '6px' }
- zoomMargin: string - Margin around lightbox image. Default: "24px"
- zoomBackgroundColor: string - Background color for lightbox. Default: "rgba(0, 0, 0, 0.6)"
- iframe: object - Styling options for iframe elements. Default: { width: '100%', height: '400px', marginTop: '6px', marginBottom: '6px' }

***Features:***
- Font size, family, and weight
- Text alignment and color
- Line height
- Margins (top and bottom)
- Special features for links (underline)
- Special features for blockquotes (border color)
- Special features for images (zoom effect, width)
- Special features for iframes (width and height)
- All style properties support responsive design and can be bound to dynamic values.
