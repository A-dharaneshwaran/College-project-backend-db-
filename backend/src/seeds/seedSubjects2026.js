'use strict';

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');

// ─── Curriculum Definition ────────────────────────────────────────────────────
// Each entry: { name, type, credits, yearSem: [year, semester] }
// yearSem determines which year and semester the subject belongs to.
// Semester = (year - 1) * 2 + (1 or 2)  → years 1-4 map to semesters 1-8
// ─────────────────────────────────────────────────────────────────────────────

const CURRICULUM = {
  CSE: [
    // Year 1
    { name: 'Programming in C',               type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Mathematics I',      type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Physics',            type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Chemistry',          type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Graphics',           type: 'Theory',   credits: 3, year: 1, sem: 1 },
    { name: 'C Programming Lab',              type: 'Lab',      credits: 2, year: 1, sem: 1 },
    { name: 'Engineering Mathematics II',     type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Digital Principles',             type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Problem Solving Techniques',     type: 'Theory',   credits: 3, year: 1, sem: 2 },
    { name: 'Environmental Science',          type: 'Theory',   credits: 3, year: 1, sem: 2 },
    { name: 'Digital Principles Lab',         type: 'Lab',      credits: 2, year: 1, sem: 2 },
    { name: 'Communication Skills',           type: 'Theory',   credits: 2, year: 1, sem: 2 },
    // Year 2
    { name: 'Data Structures',                type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Object Oriented Programming',    type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Discrete Mathematics',           type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Computer Organization',          type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Data Structures Lab',            type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'OOP Lab',                        type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Operating Systems',              type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Database Management Systems',    type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Computer Networks',              type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Design and Analysis of Algorithms', type: 'Theory', credits: 4, year: 2, sem: 4 },
    { name: 'DBMS Lab',                       type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Networks Lab',                   type: 'Lab',      credits: 2, year: 2, sem: 4 },
    // Year 3
    { name: 'Software Engineering',           type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Theory of Computation',          type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Web Technologies',               type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Cryptography & Network Security',type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Web Technologies Lab',           type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'Machine Learning',               type: 'Elective', credits: 3, year: 3, sem: 5 },
    { name: 'Compiler Design',                type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Cloud Computing',                type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Mobile Application Development', type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Microprocessors & Interfacing',  type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Compiler Design Lab',            type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Mini Project',                   type: 'Lab',      credits: 2, year: 3, sem: 6 },
    // Year 4
    { name: 'Artificial Intelligence',        type: 'Theory',   credits: 4, year: 4, sem: 7 },
    { name: 'Distributed Systems',            type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Internet of Things',             type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Deep Learning',                  type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Project Work Phase I',           type: 'Lab',      credits: 4, year: 4, sem: 7 },
    { name: 'Professional Ethics',            type: 'Theory',   credits: 2, year: 4, sem: 7 },
    { name: 'Big Data Analytics',             type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'DevOps & Containerization',      type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Project Work Phase II',          type: 'Lab',      credits: 6, year: 4, sem: 8 },
    { name: 'Employability Skills',           type: 'Theory',   credits: 2, year: 4, sem: 8 }
  ],

  ECE: [
    // Year 1 – same foundation
    { name: 'Engineering Mathematics I',      type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Physics',            type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Chemistry',          type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Circuit Theory',                 type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Graphics',           type: 'Theory',   credits: 3, year: 1, sem: 1 },
    { name: 'Physics & Chemistry Lab',        type: 'Lab',      credits: 2, year: 1, sem: 1 },
    { name: 'Engineering Mathematics II',     type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Electronic Devices & Circuits',  type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Problem Solving in C',           type: 'Theory',   credits: 3, year: 1, sem: 2 },
    { name: 'Environmental Science',          type: 'Theory',   credits: 3, year: 1, sem: 2 },
    { name: 'Electronic Devices Lab',         type: 'Lab',      credits: 2, year: 1, sem: 2 },
    { name: 'Communication Skills',           type: 'Theory',   credits: 2, year: 1, sem: 2 },
    // Year 2
    { name: 'Digital Electronics',            type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Signals and Systems',            type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Analog Circuits',                type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Electromagnetic Theory',         type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Digital Electronics Lab',        type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Analog Circuits Lab',            type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Communication Systems',          type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Linear Integrated Circuits',     type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Microprocessors',                type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Probability & Random Processes', type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'LIC Lab',                        type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Microprocessors Lab',            type: 'Lab',      credits: 2, year: 2, sem: 4 },
    // Year 3
    { name: 'VLSI Design',                    type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Digital Signal Processing',      type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Antenna & Wave Propagation',     type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Wireless Communication',         type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'VLSI Lab',                       type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'DSP Lab',                        type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'Embedded Systems',               type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Optical Communication',          type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'RF and Microwave Engineering',   type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Computer Networks',              type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Embedded Systems Lab',           type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Mini Project',                   type: 'Lab',      credits: 2, year: 3, sem: 6 },
    // Year 4
    { name: 'Internet of Things',             type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Image Processing',               type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Neural Networks',                type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Satellite Communication',        type: 'Theory',   credits: 4, year: 4, sem: 7 },
    { name: 'Project Work Phase I',           type: 'Lab',      credits: 4, year: 4, sem: 7 },
    { name: 'Professional Ethics',            type: 'Theory',   credits: 2, year: 4, sem: 7 },
    { name: 'Advanced Communication',         type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Biomedical Instrumentation',     type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Project Work Phase II',          type: 'Lab',      credits: 6, year: 4, sem: 8 },
    { name: 'Employability Skills',           type: 'Theory',   credits: 2, year: 4, sem: 8 }
  ],

  EEE: [
    { name: 'Engineering Mathematics I',      type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Physics',            type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Circuit Theory',                 type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Chemistry',          type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Graphics',           type: 'Theory',   credits: 3, year: 1, sem: 1 },
    { name: 'Electrical Lab I',               type: 'Lab',      credits: 2, year: 1, sem: 1 },
    { name: 'Engineering Mathematics II',     type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Electronic Devices',             type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Electrical Measurements',        type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Environmental Science',          type: 'Theory',   credits: 3, year: 1, sem: 2 },
    { name: 'Electrical Lab II',              type: 'Lab',      credits: 2, year: 1, sem: 2 },
    { name: 'Communication Skills',           type: 'Theory',   credits: 2, year: 1, sem: 2 },
    { name: 'Electrical Machines I',          type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Signals and Systems',            type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Digital Electronics',            type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Electromagnetic Fields',         type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Electrical Machines Lab I',      type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Digital Electronics Lab',        type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Electrical Machines II',         type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Power Electronics',              type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Control Systems',                type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Microprocessors',                type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Power Electronics Lab',          type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Control Systems Lab',            type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Power Systems I',                type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Electrical Energy Systems',      type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Switchgear & Protection',        type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Renewable Energy Systems',       type: 'Elective', credits: 3, year: 3, sem: 5 },
    { name: 'Power Systems Lab',              type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'Simulation Lab',                 type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'Power Systems II',               type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'High Voltage Engineering',       type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Electric Drives',                type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Power Quality',                  type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'High Voltage Lab',               type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Mini Project',                   type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Smart Grid Technology',          type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Flexible AC Transmission',       type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Power System Stability',         type: 'Theory',   credits: 4, year: 4, sem: 7 },
    { name: 'Embedded Systems',               type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Project Work Phase I',           type: 'Lab',      credits: 4, year: 4, sem: 7 },
    { name: 'Professional Ethics',            type: 'Theory',   credits: 2, year: 4, sem: 7 },
    { name: 'IoT for Energy Systems',         type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Advanced Power Electronics',     type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Project Work Phase II',          type: 'Lab',      credits: 6, year: 4, sem: 8 },
    { name: 'Employability Skills',           type: 'Theory',   credits: 2, year: 4, sem: 8 }
  ],

  MECH: [
    { name: 'Engineering Mathematics I',      type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Physics',            type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Chemistry',          type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Drawing',            type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Workshop Technology',            type: 'Theory',   credits: 3, year: 1, sem: 1 },
    { name: 'Workshop Lab',                   type: 'Lab',      credits: 2, year: 1, sem: 1 },
    { name: 'Engineering Mathematics II',     type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Mechanics of Solids',            type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Fluid Mechanics',                type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Environmental Science',          type: 'Theory',   credits: 3, year: 1, sem: 2 },
    { name: 'Fluid Mechanics Lab',            type: 'Lab',      credits: 2, year: 1, sem: 2 },
    { name: 'Communication Skills',           type: 'Theory',   credits: 2, year: 1, sem: 2 },
    { name: 'Thermodynamics',                 type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Manufacturing Technology I',     type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Kinematics of Machinery',        type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Strength of Materials',          type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Thermodynamics Lab',             type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Manufacturing Technology Lab I', type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Dynamics of Machinery',          type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Manufacturing Technology II',    type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Heat and Mass Transfer',         type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Metrology & Measurement',        type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Dynamics Lab',                   type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Metrology Lab',                  type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Machine Design I',               type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'CAD/CAM',                        type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Industrial Engineering',         type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Refrigeration & AC',             type: 'Elective', credits: 3, year: 3, sem: 5 },
    { name: 'CAD/CAM Lab',                    type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'Machine Design Lab',             type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'Machine Design II',              type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Finite Element Analysis',        type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Robotics',                       type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Operations Research',            type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'FEA Lab',                        type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Mini Project',                   type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Mechatronics',                   type: 'Theory',   credits: 4, year: 4, sem: 7 },
    { name: 'Composite Materials',            type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Lean Manufacturing',             type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Non-Destructive Testing',        type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Project Work Phase I',           type: 'Lab',      credits: 4, year: 4, sem: 7 },
    { name: 'Professional Ethics',            type: 'Theory',   credits: 2, year: 4, sem: 7 },
    { name: 'Industry 4.0',                   type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Advanced Manufacturing',         type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Project Work Phase II',          type: 'Lab',      credits: 6, year: 4, sem: 8 },
    { name: 'Employability Skills',           type: 'Theory',   credits: 2, year: 4, sem: 8 }
  ],

  CIVIL: [
    { name: 'Engineering Mathematics I',      type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Physics',            type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Chemistry',          type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Drawing',            type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Surveying I',                    type: 'Theory',   credits: 3, year: 1, sem: 1 },
    { name: 'Surveying Lab',                  type: 'Lab',      credits: 2, year: 1, sem: 1 },
    { name: 'Engineering Mathematics II',     type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Mechanics of Solids',            type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Fluid Mechanics',                type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Environmental Science',          type: 'Theory',   credits: 3, year: 1, sem: 2 },
    { name: 'Surveying Lab II',               type: 'Lab',      credits: 2, year: 1, sem: 2 },
    { name: 'Communication Skills',           type: 'Theory',   credits: 2, year: 1, sem: 2 },
    { name: 'Structural Analysis I',          type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Concrete Technology',            type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Hydraulics & Hydraulic Machines',type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Soil Mechanics',                 type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Concrete Lab',                   type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Hydraulics Lab',                 type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Structural Analysis II',         type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Foundation Engineering',         type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Water Supply Engineering',       type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Transportation Engineering I',   type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Soil Mechanics Lab',             type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Foundation Engineering Lab',     type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Design of RC Structures',        type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Environmental Engineering',      type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Irrigation Engineering',         type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Transportation Engineering II',  type: 'Elective', credits: 3, year: 3, sem: 5 },
    { name: 'Concrete Structures Lab',        type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'Environmental Lab',              type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'Steel Structures',               type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Remote Sensing & GIS',           type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Construction Management',        type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Quantity Surveying',             type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Steel Structures Lab',           type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Mini Project',                   type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Advanced Concrete Technology',   type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Earthquake Engineering',         type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Urban Planning',                 type: 'Theory',   credits: 4, year: 4, sem: 7 },
    { name: 'Bridge Engineering',             type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Project Work Phase I',           type: 'Lab',      credits: 4, year: 4, sem: 7 },
    { name: 'Professional Ethics',            type: 'Theory',   credits: 2, year: 4, sem: 7 },
    { name: 'Smart Structures',               type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Green Building Technology',      type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Project Work Phase II',          type: 'Lab',      credits: 6, year: 4, sem: 8 },
    { name: 'Employability Skills',           type: 'Theory',   credits: 2, year: 4, sem: 8 }
  ],

  AIDS: [
    { name: 'Engineering Mathematics I',          type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Problem Solving in Python',          type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Physics',                type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Chemistry',              type: 'Theory',   credits: 4, year: 1, sem: 1 },
    { name: 'Engineering Graphics',               type: 'Theory',   credits: 3, year: 1, sem: 1 },
    { name: 'Python Programming Lab',             type: 'Lab',      credits: 2, year: 1, sem: 1 },
    { name: 'Engineering Mathematics II',         type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Statistics for Data Science',        type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Digital Principles',                 type: 'Theory',   credits: 4, year: 1, sem: 2 },
    { name: 'Environmental Science',              type: 'Theory',   credits: 3, year: 1, sem: 2 },
    { name: 'Statistics Lab',                     type: 'Lab',      credits: 2, year: 1, sem: 2 },
    { name: 'Communication Skills',               type: 'Theory',   credits: 2, year: 1, sem: 2 },
    { name: 'Data Structures and Algorithms',     type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Database Management Systems',        type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Linear Algebra for ML',              type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Operating Systems',                  type: 'Theory',   credits: 4, year: 2, sem: 3 },
    { name: 'Data Structures Lab',                type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'DBMS Lab',                           type: 'Lab',      credits: 2, year: 2, sem: 3 },
    { name: 'Machine Learning',                   type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Data Visualization',                 type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Computer Networks',                  type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'Probability and Statistics',         type: 'Theory',   credits: 4, year: 2, sem: 4 },
    { name: 'ML Lab',                             type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Data Visualization Lab',             type: 'Lab',      credits: 2, year: 2, sem: 4 },
    { name: 'Deep Learning',                      type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Natural Language Processing',        type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Data Mining and Warehousing',        type: 'Theory',   credits: 4, year: 3, sem: 5 },
    { name: 'Cloud Computing',                    type: 'Elective', credits: 3, year: 3, sem: 5 },
    { name: 'Deep Learning Lab',                  type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'NLP Lab',                            type: 'Lab',      credits: 2, year: 3, sem: 5 },
    { name: 'Big Data Analytics',                 type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Computer Vision',                    type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Reinforcement Learning',             type: 'Elective', credits: 3, year: 3, sem: 6 },
    { name: 'Artificial Intelligence',            type: 'Theory',   credits: 4, year: 3, sem: 6 },
    { name: 'Big Data Lab',                       type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Mini Project',                       type: 'Lab',      credits: 2, year: 3, sem: 6 },
    { name: 'Generative AI',                      type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'MLOps and Deployment',               type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Explainable AI',                     type: 'Theory',   credits: 4, year: 4, sem: 7 },
    { name: 'Graph Neural Networks',              type: 'Elective', credits: 3, year: 4, sem: 7 },
    { name: 'Project Work Phase I',               type: 'Lab',      credits: 4, year: 4, sem: 7 },
    { name: 'Professional Ethics',                type: 'Theory',   credits: 2, year: 4, sem: 7 },
    { name: 'AI for Healthcare',                  type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Edge Computing',                     type: 'Elective', credits: 3, year: 4, sem: 8 },
    { name: 'Project Work Phase II',              type: 'Lab',      credits: 6, year: 4, sem: 8 },
    { name: 'Employability Skills',               type: 'Theory',   credits: 2, year: 4, sem: 8 }
  ]
};

// ─── Generate deterministic subject code ─────────────────────────────────────
// Format: <DEPTCODE><YEAR><SEM><INDEX>
// Example: CSE101 (CSE dept, year 1, sem 1, subject 01)
function makeCode(deptCode, year, sem, idx) {
  return `${deptCode.toUpperCase()}${year}${sem}${String(idx).padStart(2, '0')}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const seedSubjects = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) throw new Error('MONGODB_URI not defined');

    console.log('Connecting to database...');
    await mongoose.connect(dbUri);
    console.log('Database connected.');

    // Fetch all departments
    const departments = await Department.find().lean();
    if (!departments.length) {
      console.log('❌ No departments found. Run department seed first.');
      process.exit(1);
    }

    // Fetch all faculty grouped by department
    const allFaculty = await Faculty.find({ isTestData: true }).lean();
    const facultyByDept = {};
    for (const f of allFaculty) {
      const deptId = String(f.department);
      facultyByDept[deptId] = facultyByDept[deptId] || [];
      facultyByDept[deptId].push(f);
    }

    // Track assignment count for round-robin balancing
    const facultySubjectCount = {};
    for (const f of allFaculty) facultySubjectCount[String(f._id)] = 0;

    let totalCreated = 0;
    let totalSkipped = 0;
    const reportRows = [];
    // faculty workload map for final report
    const facultyWorkload = {};

    for (const dept of departments) {
      const deptCode = dept.code;
      const curriculum = CURRICULUM[deptCode];

      if (!curriculum) {
        console.log(`  [SKIP] No curriculum defined for dept code "${deptCode}". Skipping.`);
        continue;
      }

      console.log(`\nProcessing: ${deptCode} — ${dept.name} (${curriculum.length} subjects)`);

      const deptFaculty = facultyByDept[String(dept._id)] || [];
      if (!deptFaculty.length) {
        console.log(`  [WARN] No faculty found for ${deptCode}. Subjects will have null faculty.`);
      }

      // Build per-semester index counter for deterministic code generation
      const semIndexCounter = {};

      for (const subject of curriculum) {
        const { name, type, credits, year, sem } = subject;

        // Deterministic per-semester sequence index
        const semKey = `${sem}`;
        semIndexCounter[semKey] = (semIndexCounter[semKey] || 0) + 1;
        const code = makeCode(deptCode, year, sem, semIndexCounter[semKey]);

        // Idempotency: check by code
        const existing = await Subject.findOne({ code });
        if (existing) {
          console.log(`  [SKIP] ${code} — ${name}`);
          totalSkipped++;
          reportRows.push({
            dept: dept.name, deptCode, name, code, credits, type, year, sem,
            faculty: '(existing — not re-fetched)'
          });
          continue;
        }

        // Round-robin faculty assignment within the department
        let assignedFaculty = null;
        let assignedFacultyName = 'Unassigned';

        if (deptFaculty.length > 0) {
          // Pick faculty with lowest current load
          let minLoad = Infinity;
          for (const f of deptFaculty) {
            const cnt = facultySubjectCount[String(f._id)] || 0;
            if (cnt < minLoad) {
              minLoad = cnt;
              assignedFaculty = f;
            }
          }
          facultySubjectCount[String(assignedFaculty._id)]++;
          assignedFacultyName = assignedFaculty.employeeId;

          // Update workload report
          facultyWorkload[assignedFacultyName] = (facultyWorkload[assignedFacultyName] || 0) + 1;
        }

        await Subject.create({
          name,
          code,
          department: dept._id,
          semester: sem,
          credits,
          faculty: assignedFaculty ? assignedFaculty._id : null,
          type,
          year,
          isTestData: true,
          testBatchYear: 2026
        });

        // Also push subject reference into faculty.subjects array
        if (assignedFaculty) {
          await Faculty.findByIdAndUpdate(assignedFaculty._id, {
            $addToSet: { subjects: (await Subject.findOne({ code }))._id }
          });
        }

        console.log(`  [CREATED] ${code} — ${name} (${type}, ${credits} cr, Y${year} S${sem}) → ${assignedFacultyName}`);
        totalCreated++;

        reportRows.push({
          dept: dept.name, deptCode, name, code, credits, type, year, sem,
          faculty: assignedFacultyName
        });
      }
    }

    // ── Generate reports ──────────────────────────────────────────────────────
    const generatedDir = path.join(__dirname, '../../generated');
    if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

    // CSV
    const csvHeader = 'Department,Dept Code,Subject Name,Subject Code,Credits,Type,Year,Semester,Faculty Assigned\n';
    const csvRows = reportRows.map(r =>
      `"${r.dept}","${r.deptCode}","${r.name}","${r.code}",${r.credits},"${r.type}",${r.year},${r.sem},"${r.faculty}"`
    ).join('\n');
    fs.writeFileSync(path.join(generatedDir, 'test-subjects-2026.csv'), csvHeader + csvRows);
    console.log('\n[REPORT] Created test-subjects-2026.csv');

    // Markdown grouped by department
    let md = '# TEST SUBJECTS 2026\n\n';

    // Group by dept
    const grouped = {};
    reportRows.forEach(r => {
      grouped[r.dept] = grouped[r.dept] || {};
      grouped[r.dept][r.year] = grouped[r.dept][r.year] || {};
      grouped[r.dept][r.year][r.sem] = grouped[r.dept][r.year][r.sem] || [];
      grouped[r.dept][r.year][r.sem].push(r);
    });

    for (const [deptName, yearMap] of Object.entries(grouped)) {
      md += `## ${deptName}\n\n`;
      for (const year of [1, 2, 3, 4]) {
        if (!yearMap[year]) continue;
        md += `### Year ${year}\n\n`;
        for (const sem of Object.keys(yearMap[year]).sort()) {
          md += `#### Semester ${sem}\n\n`;
          md += '| Code | Subject | Type | Credits | Faculty |\n';
          md += '| --- | --- | --- | --- | --- |\n';
          for (const s of yearMap[year][sem]) {
            md += `| ${s.code} | ${s.name} | ${s.type} | ${s.credits} | ${s.faculty} |\n`;
          }
          md += '\n';
        }
      }
    }

    // Summary section
    md += '\n## Summary\n\n';
    md += `| Metric | Value |\n`;
    md += `| --- | --- |\n`;
    md += `| Total Departments Processed | ${departments.length} |\n`;
    md += `| Total Subjects Created (this run) | ${totalCreated} |\n`;
    md += `| Total Subjects Skipped (already existed) | ${totalSkipped} |\n`;
    md += `| Total Subject Records | ${reportRows.length} |\n`;
    md += '\n### Faculty Workload\n\n';
    md += '| Employee ID | Subjects Assigned |\n';
    md += '| --- | --- |\n';
    for (const [empId, cnt] of Object.entries(facultyWorkload)) {
      md += `| ${empId} | ${cnt} |\n`;
    }

    fs.writeFileSync(path.join(generatedDir, 'TEST_SUBJECTS_2026.md'), md);
    console.log('[REPORT] Created TEST_SUBJECTS_2026.md');

    // ── Final console summary ─────────────────────────────────────────────────
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUBJECT SEEDING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total departments processed : ${departments.length}`);
    console.log(`Total subjects created      : ${totalCreated}`);
    console.log(`Total subjects skipped      : ${totalSkipped}`);
    console.log(`Total subject records       : ${reportRows.length}`);
    console.log('Reports saved to backend/generated/');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedSubjects();
