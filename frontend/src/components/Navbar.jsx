import React, { useState } from "react";
import { Link } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";

import MenuIcon from "@mui/icons-material/Menu";

import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
  },
});

const pages = [
  { name: "Attendance", path: "/attendance" },
  { name: "Holidays", path: "/holidays" },
  { name: "Clubs", path: "/clubs" },
  { name: "Placements", path: "/placements" },
  { name: "Papers", path: "/papers" },
];

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="sticky" sx={{ background: "#000" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            sx={{ display: { md: "none" }, mr: 2 }}
            onClick={() => setOpen(!open)}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "white",
              fontWeight: "bold",
            }}
          >
            ERP-CBIT
          </Typography>

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                component={Link}
                to={page.path}
                sx={{ color: "white" }}
              >
                {page.name}
              </Button>
            ))}
          </Box>
        </Toolbar>

        <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
          <Box sx={{ width: 250, p: 2 }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                component={Link}
                to={page.path}
                fullWidth
                sx={{ justifyContent: "flex-start", mb: 1 }}
                onClick={() => setOpen(false)}
              >
                {page.name}
              </Button>
            ))}
          </Box>
        </Drawer>
      </AppBar>
    </ThemeProvider>
  );
}

export default Navbar;
