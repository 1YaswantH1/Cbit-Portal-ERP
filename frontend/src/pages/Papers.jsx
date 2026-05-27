import "../css/papers.css";

function Papers() {
    const papers = [
        {
            title: "B.E. Question Papers",
            link: "https://spdc.cbit.org.in/course/view.php?id=227",
        },
        {
            title: "M.E/M.Tech Question Papers",
            link: "https://spdc.cbit.org.in/course/view.php?id=228",
        },
        {
            title: "MBA Question Papers",
            link: "https://spdc.cbit.org.in/course/view.php?id=229",
        },
        {
            title: "MCA Question Papers",
            link: "https://spdc.cbit.org.in/course/view.php?id=230",
        },
    ];

    return (
        <div className="papers-container">
            <h1 className="papers-heading">
                CBIT Previous Year Question Papers
            </h1>

            <div className="papers-grid">
                {papers.map((paper, index) => (
                    <a
                        key={index}
                        href={paper.link}
                        target="_blank"
                        rel="noreferrer"
                        className="paper-card"
                    >
                        <div
                            className="paper-image"
                            style={{
                                backgroundImage: `url(/books.png)`,
                            }}
                        ></div>

                        <div className="paper-title">{paper.title}</div>
                    </a>
                ))}
            </div>
        </div>
    );
}

export default Papers;