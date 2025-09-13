# 797events — Project Overview

## Goal
Build a Next.js website for **797events** with the following major features:
- Landing page with hero section, shader background (dark purple matte style).
- Events carousel showing **Event Cards**.
- Each Event Card: full image (not cropped) + description, venue, time/date, Book Now button.
- Booking modal (glassmorph style) with ticket types, quantity, user info → submission to backend → backend forwards to Google Form.
- Sign in / Sign up (for users).
- Admin login → Admin Dashboard where admin can add, edit, delete events, upload ticket images, and control visibility.
- Responsive, modern design with accessibility and performance in mind.

## Component Requirements (MUST be used as-is)
the codes for the component will be provided,if required ask the user.
1. **Footer Social Links**  
   Source: [CodePen](https://codepen.io/Xenos_Arcanum/pen/LYeoppv)  
   - Only keep **Instagram** and **Facebook** icons.  
   - This exact style must be used, not recreated.

2. **Event Card**  
   Source: [CodePen](https://codepen.io/FlorinPop17/pen/rRaEYv)  
   - Show the **full event image** (not cropped).  
   - Below the image: description, venue, time/date.  
   - Add a **Book Now button** using the Button component (see #4).  
   - Each card maps strictly to one event.

3. **Shader Background**  
   Source: [CodePen](https://codepen.io/chrisjdesigner/pen/dymOxrZ)  
   - Use as the **background of the hero section**.  
   - Must be dark purple with a matte finish.  
   - Do not replace with gradients; use the shader as provided.

4. **Buttons**  
   Source: [CodePen](https://codepen.io/matovius/pen/qBeqJXX)  
   - Every button in the app (CTA buttons, Book Now, Sign In, Submit, Admin actions, etc.) must use this style.  
   - No other button styling allowed.

5. **Glassmorph Dialogues**  
   Source: [CodePen](https://codepen.io/fghty/pen/PojKNEG)  
   - Every modal, booking form, dialogue box, admin form, etc. must use this glassmorph component.  
   - Must preserve the transparency, blur, and border glow as in the original.

## Functional Flow
- User visits landing page → sees hero + carousel.  
- Book Now button → opens glassmorph booking modal with event-specific details.  
- Submit → `/api/book` → forwards to Google Form (server-side).  
- User sees confirmation message.  

Admin flow: login → dashboard → add/edit/delete events → upload image → instantly reflected in carousel.  

## Backend integration
- Server-side booking API → posts to Google Form (with env var mapping).  
- Auth with NextAuth (email/Google + admin role).  
- Admin events CRUD (protected routes).  
- Image upload via Cloudinary or S3.  

## Non-Functional Requirements
- Responsive & mobile-first.  
- Accessibility (ARIA labels, keyboard focus).  
- Performance (lazy images, optimized).  
- No design modifications of CodePen components.  

## Deployment
- Host on Vercel.  
- Environment variables:
  - `GOOGLE_FORM_ID`
  - `GOOGLE_ENTRY_*` (for field mappings)
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `CLOUDINARY_URL` or `S3_BUCKET_URL`
  - `DATABASE_URL` (if Supabase/Postgres used)

---

### 🚨 STRICT INSTRUCTION TO CLAUDE:
- **Do not restyle or “approximate” the CodePen components.**  
- Integrate the CodePen HTML/CSS **directly** into React components inside the Next.js project.  
- Map props (title, image, venue, etc.) to replace the hardcoded demo text/images in the CodePen examples.  
- Only adjustments allowed: making images fully visible in Event Card, and inserting Book Now button under content.  
